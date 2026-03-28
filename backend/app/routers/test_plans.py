from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user, require_admin
from ..models import (
    Quiz,
    QuizOption,
    TestPlan,
    TestPlanItem,
    TestSession,
    TestSessionAnswer,
    User,
)
from ..services.xp import xp_for_answer

router = APIRouter(prefix="/test-plans", tags=["test-plans"])
sessions_router = APIRouter(prefix="/test-sessions", tags=["test-sessions"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TestPlanItemIn(BaseModel):
    quiz_id: str
    order: int = 0


class TestPlanCreate(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = None
    status: str = "active"
    quiz_ids: list[str] = []


class TestPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    quiz_ids: Optional[list[str]] = None


class TestPlanItemOut(BaseModel):
    id: str
    quiz_id: str
    order: int
    question: str
    type: str
    xp_reward: int


class TestPlanOut(BaseModel):
    id: str
    admin_id: str
    user_id: str
    title: str
    description: Optional[str]
    status: str
    item_count: int
    created_at: datetime
    updated_at: datetime


class TestPlanDetailOut(TestPlanOut):
    items: list[TestPlanItemOut]


class OptionPublic(BaseModel):
    id: str
    text: str
    order: int


class QuizPublic(BaseModel):
    id: str
    type: str
    question: str
    xp_reward: int
    order: int
    options: list[OptionPublic]


class TestSessionOut(BaseModel):
    id: str
    test_plan_id: str
    user_id: str
    status: str
    xp_earned: int
    correct_count: int
    total_count: int
    started_at: datetime
    completed_at: Optional[datetime]


class TestSessionDetailOut(TestSessionOut):
    plan_title: str
    quizzes: list[QuizPublic]


class AnswerRequest(BaseModel):
    quiz_id: str
    answer: str


class AnswerResponse(BaseModel):
    is_correct: bool
    explanation: Optional[str]
    xp_earned: int
    correct_option_id: Optional[str] = None


class SessionAnswerOut(BaseModel):
    quiz_id: str
    answer: str
    is_correct: bool
    xp_earned: int
    answered_at: datetime


class CompleteResponse(BaseModel):
    xp_earned: int
    correct_count: int
    total_count: int
    perfect: bool


class HistorySessionOut(TestSessionOut):
    answers: list[SessionAnswerOut]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _plan_items(plan_id: str, session: Session) -> list[TestPlanItemOut]:
    items = session.exec(
        select(TestPlanItem)
        .where(TestPlanItem.test_plan_id == plan_id)
        .order_by(TestPlanItem.order)
    ).all()
    result = []
    for item in items:
        quiz = session.get(Quiz, item.quiz_id)
        if quiz:
            result.append(TestPlanItemOut(
                id=item.id,
                quiz_id=item.quiz_id,
                order=item.order,
                question=quiz.question,
                type=quiz.type,
                xp_reward=quiz.xp_reward,
            ))
    return result


def _load_quizzes(plan_id: str, session: Session) -> list[QuizPublic]:
    items = session.exec(
        select(TestPlanItem)
        .where(TestPlanItem.test_plan_id == plan_id)
        .order_by(TestPlanItem.order)
    ).all()
    quizzes = []
    for item in items:
        quiz = session.get(Quiz, item.quiz_id)
        if not quiz:
            continue
        opts = session.exec(
            select(QuizOption)
            .where(QuizOption.quiz_id == quiz.id)
            .order_by(QuizOption.order)
        ).all()
        quizzes.append(QuizPublic(
            **quiz.model_dump(exclude={"explanation", "lesson_id", "created_at"}),
            options=[OptionPublic(id=o.id, text=o.text, order=o.order) for o in opts],
        ))
    return quizzes


# ---------------------------------------------------------------------------
# Test Plan CRUD (admin manages, user reads own)
# ---------------------------------------------------------------------------

@router.post("", response_model=TestPlanDetailOut)
def create_test_plan(
    body: TestPlanCreate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    # Validate assigned user exists
    target = session.get(User, body.user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    plan = TestPlan(
        admin_id=current_user.id,
        user_id=body.user_id,
        title=body.title,
        description=body.description,
        status=body.status,
    )
    session.add(plan)
    session.flush()  # get plan.id before adding items

    for idx, quiz_id in enumerate(body.quiz_ids):
        quiz = session.get(Quiz, quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail=f"Quiz {quiz_id} not found")
        session.add(TestPlanItem(test_plan_id=plan.id, quiz_id=quiz_id, order=idx))

    session.commit()
    session.refresh(plan)
    items = _plan_items(plan.id, session)
    return TestPlanDetailOut(**plan.model_dump(), item_count=len(items), items=items)


@router.get("", response_model=list[TestPlanOut])
def list_test_plans(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role == "admin":
        plans = session.exec(select(TestPlan).order_by(TestPlan.created_at.desc())).all()
    else:
        plans = session.exec(
            select(TestPlan)
            .where(TestPlan.user_id == current_user.id, TestPlan.status != "archived")
            .order_by(TestPlan.created_at.desc())
        ).all()

    result = []
    for plan in plans:
        count = len(session.exec(
            select(TestPlanItem).where(TestPlanItem.test_plan_id == plan.id)
        ).all())
        result.append(TestPlanOut(**plan.model_dump(), item_count=count))
    return result


@router.get("/{plan_id}", response_model=TestPlanDetailOut)
def get_test_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    plan = session.get(TestPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Test plan not found")
    if current_user.role != "admin" and plan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    items = _plan_items(plan.id, session)
    return TestPlanDetailOut(**plan.model_dump(), item_count=len(items), items=items)


@router.put("/{plan_id}", response_model=TestPlanDetailOut)
def update_test_plan(
    plan_id: str,
    body: TestPlanUpdate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    plan = session.get(TestPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Test plan not found")

    if body.title is not None:
        plan.title = body.title
    if body.description is not None:
        plan.description = body.description
    if body.status is not None:
        plan.status = body.status
    plan.updated_at = datetime.utcnow()

    if body.quiz_ids is not None:
        # Replace all items
        existing = session.exec(
            select(TestPlanItem).where(TestPlanItem.test_plan_id == plan_id)
        ).all()
        for item in existing:
            session.delete(item)
        session.flush()
        for idx, quiz_id in enumerate(body.quiz_ids):
            quiz = session.get(Quiz, quiz_id)
            if not quiz:
                raise HTTPException(status_code=404, detail=f"Quiz {quiz_id} not found")
            session.add(TestPlanItem(test_plan_id=plan_id, quiz_id=quiz_id, order=idx))

    session.add(plan)
    session.commit()
    session.refresh(plan)
    items = _plan_items(plan.id, session)
    return TestPlanDetailOut(**plan.model_dump(), item_count=len(items), items=items)


@router.delete("/{plan_id}", status_code=204)
def delete_test_plan(
    plan_id: str,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    plan = session.get(TestPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Test plan not found")

    # Cascade delete items, sessions, answers
    items = session.exec(select(TestPlanItem).where(TestPlanItem.test_plan_id == plan_id)).all()
    for item in items:
        session.delete(item)

    test_sessions = session.exec(select(TestSession).where(TestSession.test_plan_id == plan_id)).all()
    for ts in test_sessions:
        answers = session.exec(
            select(TestSessionAnswer).where(TestSessionAnswer.test_session_id == ts.id)
        ).all()
        for ans in answers:
            session.delete(ans)
        session.delete(ts)

    session.delete(plan)
    session.commit()


# ---------------------------------------------------------------------------
# Sessions — start / answer / complete (on test-plans sub-resource)
# ---------------------------------------------------------------------------

@router.post("/{plan_id}/sessions", response_model=TestSessionDetailOut)
def start_session(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    plan = session.get(TestPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Test plan not found")
    if current_user.role != "admin" and plan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if plan.status == "archived":
        raise HTTPException(status_code=400, detail="Test plan is archived")

    items = session.exec(
        select(TestPlanItem).where(TestPlanItem.test_plan_id == plan_id)
    ).all()
    if not items:
        raise HTTPException(status_code=400, detail="Test plan has no quizzes")

    ts = TestSession(
        test_plan_id=plan_id,
        user_id=current_user.id,
        total_count=len(items),
    )
    session.add(ts)
    session.commit()
    session.refresh(ts)

    quizzes = _load_quizzes(plan_id, session)
    return TestSessionDetailOut(
        **ts.model_dump(),
        plan_title=plan.title,
        quizzes=quizzes,
    )


@router.get("/{plan_id}/sessions", response_model=list[HistorySessionOut])
def list_sessions(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    plan = session.get(TestPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Test plan not found")
    if current_user.role != "admin" and plan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Admin sees all sessions; user sees own
    query = select(TestSession).where(TestSession.test_plan_id == plan_id)
    if current_user.role != "admin":
        query = query.where(TestSession.user_id == current_user.id)
    test_sessions = session.exec(query.order_by(TestSession.started_at.desc())).all()

    result = []
    for ts in test_sessions:
        answers = session.exec(
            select(TestSessionAnswer).where(TestSessionAnswer.test_session_id == ts.id)
        ).all()
        result.append(HistorySessionOut(
            **ts.model_dump(),
            answers=[
                SessionAnswerOut(
                    quiz_id=a.quiz_id,
                    answer=a.answer,
                    is_correct=a.is_correct,
                    xp_earned=a.xp_earned,
                    answered_at=a.answered_at,
                )
                for a in answers
            ],
        ))
    return result


# ---------------------------------------------------------------------------
# Session actions (on /test-sessions/{session_id})
# ---------------------------------------------------------------------------

@sessions_router.get("/{session_id}", response_model=TestSessionDetailOut)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    ts = session.get(TestSession, session_id)
    if not ts:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user.role != "admin" and ts.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    plan = session.get(TestPlan, ts.test_plan_id)
    quizzes = _load_quizzes(ts.test_plan_id, session)
    return TestSessionDetailOut(
        **ts.model_dump(),
        plan_title=plan.title if plan else "",
        quizzes=quizzes,
    )


@sessions_router.post("/{session_id}/answer", response_model=AnswerResponse)
def submit_answer(
    session_id: str,
    body: AnswerRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    ts = session.get(TestSession, session_id)
    if not ts or ts.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if ts.status == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")

    # Verify quiz belongs to this test plan
    item = session.exec(
        select(TestPlanItem).where(
            TestPlanItem.test_plan_id == ts.test_plan_id,
            TestPlanItem.quiz_id == body.quiz_id,
        )
    ).first()
    if not item:
        raise HTTPException(status_code=400, detail="Quiz not in this test plan")

    quiz = session.get(Quiz, body.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Determine correctness server-side
    is_correct = False
    correct_option_id: Optional[str] = None

    if quiz.type == "TRUE_FALSE":
        correct_opt = session.exec(
            select(QuizOption).where(QuizOption.quiz_id == quiz.id, QuizOption.is_correct == True)  # noqa: E712
        ).first()
        if correct_opt:
            correct_option_id = correct_opt.id
            is_correct = body.answer.lower() == correct_opt.text.lower()
    else:
        chosen_opt = session.get(QuizOption, body.answer)
        if chosen_opt and chosen_opt.quiz_id == quiz.id:
            is_correct = chosen_opt.is_correct
        correct_opt = session.exec(
            select(QuizOption).where(QuizOption.quiz_id == quiz.id, QuizOption.is_correct == True)  # noqa: E712
        ).first()
        if correct_opt:
            correct_option_id = correct_opt.id

    xp = xp_for_answer(quiz.xp_reward, current_user.streak) if is_correct else 0

    # Persist or update answer
    existing = session.exec(
        select(TestSessionAnswer).where(
            TestSessionAnswer.test_session_id == session_id,
            TestSessionAnswer.quiz_id == body.quiz_id,
        )
    ).first()
    if existing:
        existing.answer = body.answer
        existing.is_correct = is_correct
        existing.xp_earned = xp
        existing.answered_at = datetime.utcnow()
        session.add(existing)
    else:
        session.add(TestSessionAnswer(
            test_session_id=session_id,
            quiz_id=body.quiz_id,
            answer=body.answer,
            is_correct=is_correct,
            xp_earned=xp,
        ))
    session.commit()

    return AnswerResponse(
        is_correct=is_correct,
        explanation=quiz.explanation,
        xp_earned=xp,
        correct_option_id=correct_option_id,
    )


@sessions_router.post("/{session_id}/complete", response_model=CompleteResponse)
def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    ts = session.get(TestSession, session_id)
    if not ts or ts.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    if ts.status == "completed":
        return CompleteResponse(
            xp_earned=ts.xp_earned,
            correct_count=ts.correct_count,
            total_count=ts.total_count,
            perfect=ts.correct_count == ts.total_count and ts.total_count > 0,
        )

    answers = session.exec(
        select(TestSessionAnswer).where(TestSessionAnswer.test_session_id == session_id)
    ).all()
    correct_count = sum(1 for a in answers if a.is_correct)
    xp = sum(a.xp_earned for a in answers)

    ts.status = "completed"
    ts.correct_count = correct_count
    ts.xp_earned = xp
    ts.completed_at = datetime.utcnow()
    session.add(ts)

    # Award XP to user
    current_user.xp += xp
    session.add(current_user)

    session.commit()

    return CompleteResponse(
        xp_earned=xp,
        correct_count=correct_count,
        total_count=ts.total_count,
        perfect=correct_count == ts.total_count and ts.total_count > 0,
    )
