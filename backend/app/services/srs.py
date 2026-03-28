"""Spaced Repetition System (SM-2 algorithm) for quiz scheduling."""
from datetime import date, timedelta

from sqlmodel import Session, select

from ..models import QuizSRSState


def update_srs_state(user_id: str, quiz_id: str, is_correct: bool, session: Session) -> None:
    """Update SM-2 SRS state for a quiz after answering. Does not commit."""
    today = date.today().isoformat()

    state = session.exec(
        select(QuizSRSState).where(
            QuizSRSState.user_id == user_id,
            QuizSRSState.quiz_id == quiz_id,
        )
    ).first()

    if not state:
        state = QuizSRSState(
            user_id=user_id,
            quiz_id=quiz_id,
            next_review=today,
        )

    # SM-2: quality 4 for correct, 1 for incorrect (range 0-5)
    quality = 4 if is_correct else 1

    if quality >= 3:
        if state.repetitions == 0:
            state.interval = 1
        elif state.repetitions == 1:
            state.interval = 6
        else:
            state.interval = round(state.interval * state.ease_factor)
        state.repetitions += 1
        state.ease_factor = max(
            1.3,
            state.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
        )
    else:
        # Wrong answer: reset repetitions, shorten interval
        state.repetitions = 0
        state.interval = 1
        state.ease_factor = max(1.3, state.ease_factor - 0.2)

    state.next_review = (date.today() + timedelta(days=state.interval)).isoformat()
    state.last_reviewed = today
    session.add(state)
