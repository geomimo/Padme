/**
 * Tests for the useQuizSession Zustand store.
 * Covers: initialization, answering, advancing, completing, and resetting.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useQuizSession } from "@/hooks/useQuizSession";
import type { AnswerResponse, CompleteResponse, QuizPublic } from "@/types";

const makeQuiz = (id: string, type: "MULTIPLE_CHOICE" | "TRUE_FALSE" = "MULTIPLE_CHOICE"): QuizPublic => ({
  id,
  type,
  question: `Question ${id}?`,
  xp_reward: 10,
  order: 0,
  options: [
    { id: `${id}-opt-1`, text: "Option A", order: 0 },
    { id: `${id}-opt-2`, text: "Option B", order: 1 },
  ],
});

const makeAnswerResponse = (isCorrect: boolean): AnswerResponse => ({
  is_correct: isCorrect,
  explanation: "Test explanation",
  xp_earned: isCorrect ? 10 : 0,
  correct_option_id: "opt-1",
});

const makeCompleteResponse = (): CompleteResponse => ({
  xp_earned: 50,
  new_total_xp: 100,
  streak: 3,
  longest_streak: 5,
  perfect_set: false,
  correct_count: 4,
  total_count: 5,
});

beforeEach(() => {
  useQuizSession.getState().reset();
});

describe("useQuizSession — initial state", () => {
  it("starts in idle state", () => {
    const { sessionState } = useQuizSession.getState();
    expect(sessionState).toBe("idle");
  });

  it("starts with no quizzes or answers", () => {
    const state = useQuizSession.getState();
    expect(state.quizzes).toHaveLength(0);
    expect(state.answers).toHaveLength(0);
    expect(state.currentIndex).toBe(0);
    expect(state.completionResult).toBeNull();
  });
});

describe("useQuizSession — init", () => {
  it("sets quizzes and transitions to answering state", () => {
    const quizzes = [makeQuiz("q1"), makeQuiz("q2")];
    useQuizSession.getState().init("set-123", quizzes);

    const state = useQuizSession.getState();
    expect(state.dailySetId).toBe("set-123");
    expect(state.quizzes).toHaveLength(2);
    expect(state.sessionState).toBe("answering");
    expect(state.currentIndex).toBe(0);
  });

  it("clears previous answers on re-init", () => {
    const quizzes = [makeQuiz("q1")];
    useQuizSession.getState().init("set-1", quizzes);
    useQuizSession.getState().recordAnswer("q1", "opt-1", makeAnswerResponse(true));

    useQuizSession.getState().init("set-2", quizzes);
    expect(useQuizSession.getState().answers).toHaveLength(0);
  });
});

describe("useQuizSession — recordAnswer", () => {
  it("records an answer and transitions to feedback state", () => {
    useQuizSession.getState().init("set-1", [makeQuiz("q1")]);
    useQuizSession.getState().recordAnswer("q1", "opt-1", makeAnswerResponse(true));

    const state = useQuizSession.getState();
    expect(state.answers).toHaveLength(1);
    expect(state.sessionState).toBe("feedback");
  });

  it("stores correct answer fields", () => {
    useQuizSession.getState().init("set-1", [makeQuiz("q1")]);
    const response = makeAnswerResponse(true);
    useQuizSession.getState().recordAnswer("q1", "opt-1", response);

    const answer = useQuizSession.getState().answers[0];
    expect(answer.quizId).toBe("q1");
    expect(answer.answer).toBe("opt-1");
    expect(answer.isCorrect).toBe(true);
    expect(answer.xpEarned).toBe(10);
    expect(answer.explanation).toBe("Test explanation");
    expect(answer.correctOptionId).toBe("opt-1");
  });

  it("records an incorrect answer with zero xp", () => {
    useQuizSession.getState().init("set-1", [makeQuiz("q1")]);
    useQuizSession.getState().recordAnswer("q1", "opt-2", makeAnswerResponse(false));

    const answer = useQuizSession.getState().answers[0];
    expect(answer.isCorrect).toBe(false);
    expect(answer.xpEarned).toBe(0);
  });

  it("accumulates multiple answers", () => {
    const quizzes = [makeQuiz("q1"), makeQuiz("q2"), makeQuiz("q3")];
    useQuizSession.getState().init("set-1", quizzes);
    useQuizSession.getState().recordAnswer("q1", "opt-1", makeAnswerResponse(true));
    useQuizSession.getState().advance();
    useQuizSession.getState().recordAnswer("q2", "opt-2", makeAnswerResponse(false));

    expect(useQuizSession.getState().answers).toHaveLength(2);
  });
});

describe("useQuizSession — advance", () => {
  it("increments currentIndex and returns to answering state", () => {
    useQuizSession.getState().init("set-1", [makeQuiz("q1"), makeQuiz("q2")]);
    useQuizSession.getState().recordAnswer("q1", "opt-1", makeAnswerResponse(true));
    useQuizSession.getState().advance();

    const state = useQuizSession.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.sessionState).toBe("answering");
  });

  it("transitions to complete state after last question", () => {
    useQuizSession.getState().init("set-1", [makeQuiz("q1")]);
    useQuizSession.getState().recordAnswer("q1", "opt-1", makeAnswerResponse(true));
    useQuizSession.getState().advance();

    const state = useQuizSession.getState();
    expect(state.sessionState).toBe("complete");
    expect(state.currentIndex).toBe(1);
  });

  it("handles a full 5-question session", () => {
    const quizzes = Array.from({ length: 5 }, (_, i) => makeQuiz(`q${i}`));
    useQuizSession.getState().init("set-1", quizzes);

    for (let i = 0; i < 5; i++) {
      expect(useQuizSession.getState().sessionState).toBe("answering");
      useQuizSession.getState().recordAnswer(`q${i}`, "opt-1", makeAnswerResponse(true));
      expect(useQuizSession.getState().sessionState).toBe("feedback");
      useQuizSession.getState().advance();
    }

    expect(useQuizSession.getState().sessionState).toBe("complete");
  });
});

describe("useQuizSession — setComplete", () => {
  it("stores the completion result", () => {
    useQuizSession.getState().init("set-1", [makeQuiz("q1")]);
    const result = makeCompleteResponse();
    useQuizSession.getState().setComplete(result);

    expect(useQuizSession.getState().completionResult).toEqual(result);
  });
});

describe("useQuizSession — reset", () => {
  it("returns to initial idle state", () => {
    const quizzes = [makeQuiz("q1")];
    useQuizSession.getState().init("set-1", quizzes);
    useQuizSession.getState().recordAnswer("q1", "opt-1", makeAnswerResponse(true));
    useQuizSession.getState().setComplete(makeCompleteResponse());
    useQuizSession.getState().reset();

    const state = useQuizSession.getState();
    expect(state.sessionState).toBe("idle");
    expect(state.dailySetId).toBeNull();
    expect(state.quizzes).toHaveLength(0);
    expect(state.answers).toHaveLength(0);
    expect(state.currentIndex).toBe(0);
    expect(state.completionResult).toBeNull();
  });
});
