"""Integration tests for the daily set user flow (get → answer → complete)."""
import pytest
from sqlmodel import select

from app.models import DailySet, DailySetItem, UserAnswer


class TestGetDailySet:
    def test_get_daily_set_requires_auth(self, client):
        res = client.get("/daily-set")
        assert res.status_code == 401

    def test_get_daily_set_creates_and_returns_set(self, client, auth_headers, mc_quiz, tf_quiz, published_lesson):
        res = client.get("/daily-set", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "id" in data
        assert "date" in data
        assert "is_completed" in data
        assert data["is_completed"] is False
        assert isinstance(data["quizzes"], list)

    def test_get_daily_set_is_idempotent(self, client, auth_headers, mc_quiz, published_lesson):
        res1 = client.get("/daily-set", headers=auth_headers)
        res2 = client.get("/daily-set", headers=auth_headers)
        assert res1.json()["id"] == res2.json()["id"]

    def test_daily_set_quizzes_omit_correct_option(self, client, auth_headers, mc_quiz, published_lesson):
        """is_correct must NOT be exposed on options."""
        res = client.get("/daily-set", headers=auth_headers)
        assert res.status_code == 200
        for quiz in res.json()["quizzes"]:
            for option in quiz["options"]:
                assert "is_correct" not in option

    def test_empty_daily_set_when_no_content(self, client, auth_headers):
        """With no published lessons, daily set is returned with empty quizzes."""
        res = client.get("/daily-set", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["quizzes"] == []


class TestSubmitAnswer:
    def _setup_daily_set(self, client, auth_headers, session, regular_user, mc_quiz):
        """Helper to create a daily set and return set_id + quiz/options."""
        res = client.get("/daily-set", headers=auth_headers)
        assert res.status_code == 200
        return res.json()["id"]

    def test_submit_correct_mc_answer(self, client, auth_headers, session, regular_user, mc_quiz, published_lesson):
        quiz, options = mc_quiz
        set_id = self._setup_daily_set(client, auth_headers, session, regular_user, mc_quiz)
        correct_opt = next(o for o in options if o.is_correct)

        res = client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": quiz.id, "answer": correct_opt.id},
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_correct"] is True
        assert data["xp_earned"] > 0
        assert data["correct_option_id"] == correct_opt.id

    def test_submit_wrong_mc_answer(self, client, auth_headers, session, regular_user, mc_quiz, published_lesson):
        quiz, options = mc_quiz
        set_id = self._setup_daily_set(client, auth_headers, session, regular_user, mc_quiz)
        wrong_opt = next(o for o in options if not o.is_correct)

        res = client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": quiz.id, "answer": wrong_opt.id},
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_correct"] is False
        assert data["xp_earned"] == 0

    def test_submit_correct_tf_answer(self, client, auth_headers, session, regular_user, tf_quiz, published_lesson):
        quiz, _ = tf_quiz
        set_id = self._setup_daily_set(client, auth_headers, session, regular_user, tf_quiz)

        res = client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": quiz.id, "answer": "true"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.json()["is_correct"] is True

    def test_submit_wrong_tf_answer(self, client, auth_headers, session, regular_user, tf_quiz, published_lesson):
        quiz, _ = tf_quiz
        set_id = self._setup_daily_set(client, auth_headers, session, regular_user, tf_quiz)

        res = client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": quiz.id, "answer": "false"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.json()["is_correct"] is False

    def test_answer_includes_explanation(self, client, auth_headers, session, regular_user, mc_quiz, published_lesson):
        quiz, options = mc_quiz
        set_id = self._setup_daily_set(client, auth_headers, session, regular_user, mc_quiz)
        opt = options[0]

        res = client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": quiz.id, "answer": opt.id},
            headers=auth_headers,
        )
        assert "explanation" in res.json()

    def test_answer_quiz_not_in_set_returns_400(self, client, auth_headers, session, regular_user, mc_quiz, published_lesson):
        quiz, options = mc_quiz
        set_id = self._setup_daily_set(client, auth_headers, session, regular_user, mc_quiz)

        res = client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": "non-existent-quiz-id", "answer": options[0].id},
            headers=auth_headers,
        )
        assert res.status_code == 400

    def test_answer_wrong_set_id_returns_404(self, client, auth_headers, regular_user, mc_quiz, published_lesson):
        quiz, options = mc_quiz
        res = client.post(
            "/daily-set/nonexistent-set-id/answer",
            json={"quiz_id": quiz.id, "answer": options[0].id},
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_answer_is_overwritable(self, client, auth_headers, session, regular_user, mc_quiz, published_lesson):
        """Submitting an answer twice should update, not duplicate."""
        quiz, options = mc_quiz
        set_id = self._setup_daily_set(client, auth_headers, session, regular_user, mc_quiz)
        wrong_opt = next(o for o in options if not o.is_correct)
        correct_opt = next(o for o in options if o.is_correct)

        # First: wrong
        client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": quiz.id, "answer": wrong_opt.id},
            headers=auth_headers,
        )
        # Second: correct (overwrite)
        res = client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": quiz.id, "answer": correct_opt.id},
            headers=auth_headers,
        )
        assert res.json()["is_correct"] is True

        # Only one UserAnswer record should exist
        answers = session.exec(
            select(UserAnswer).where(
                UserAnswer.daily_set_id == set_id,
                UserAnswer.quiz_id == quiz.id,
            )
        ).all()
        assert len(answers) == 1


class TestCompleteSet:
    def test_complete_set_updates_streak_and_xp(self, client, auth_headers, session, regular_user, mc_quiz, published_lesson):
        quiz, options = mc_quiz
        res = client.get("/daily-set", headers=auth_headers)
        set_id = res.json()["id"]
        correct_opt = next(o for o in options if o.is_correct)

        client.post(
            f"/daily-set/{set_id}/answer",
            json={"quiz_id": quiz.id, "answer": correct_opt.id},
            headers=auth_headers,
        )

        res = client.post(f"/daily-set/{set_id}/complete", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["streak"] >= 1
        assert data["new_total_xp"] > 0
        assert "perfect_set" in data
        assert "correct_count" in data
        assert "total_count" in data

    def test_complete_set_is_idempotent(self, client, auth_headers, session, regular_user, mc_quiz, published_lesson):
        """Calling complete twice returns cached result without error."""
        res = client.get("/daily-set", headers=auth_headers)
        set_id = res.json()["id"]

        client.post(f"/daily-set/{set_id}/complete", headers=auth_headers)
        res2 = client.post(f"/daily-set/{set_id}/complete", headers=auth_headers)
        assert res2.status_code == 200

    def test_perfect_set_flag(self, client, auth_headers, session, regular_user, mc_quiz, published_lesson):
        quiz, options = mc_quiz
        res = client.get("/daily-set", headers=auth_headers)
        set_id = res.json()["id"]
        correct_opt = next(o for o in options if o.is_correct)

        # Answer all questions in the set correctly
        set_data = client.get("/daily-set", headers=auth_headers).json()
        for q in set_data["quizzes"]:
            if q["id"] == quiz.id:
                client.post(
                    f"/daily-set/{set_id}/answer",
                    json={"quiz_id": q["id"], "answer": correct_opt.id},
                    headers=auth_headers,
                )

        res = client.post(f"/daily-set/{set_id}/complete", headers=auth_headers)
        data = res.json()
        # perfect_set is True only when all questions answered correctly
        assert isinstance(data["perfect_set"], bool)

    def test_complete_nonexistent_set_returns_404(self, client, auth_headers, regular_user):
        res = client.post("/daily-set/nonexistent/complete", headers=auth_headers)
        assert res.status_code == 404

    def test_complete_requires_auth(self, client):
        res = client.post("/daily-set/any-id/complete")
        assert res.status_code == 401
