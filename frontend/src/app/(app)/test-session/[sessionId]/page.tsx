"use client";
import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { testSessionsApi } from "@/lib/api";
import type { TestSessionDetail, TestCompleteResponse } from "@/types";
import { QuizProgressBar } from "@/components/quiz/ProgressBar";
import { MultipleChoiceQuestion } from "@/components/quiz/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "@/components/quiz/TrueFalseQuestion";
import { AnswerFeedback } from "@/components/quiz/AnswerFeedback";
import { motion, AnimatePresence } from "framer-motion";

type SessionState = "loading" | "answering" | "feedback" | "complete";

interface QuizAnswer {
  quizId: string;
  answer: string;
  isCorrect: boolean;
  xpEarned: number;
  correctOptionId: string | null;
  explanation: string | null;
  detail: string | null;
}

export default function TestSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [sessionData, setSessionData] = useState<TestSessionDetail | null>(null);
  const [state, setState] = useState<SessionState>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TestCompleteResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    testSessionsApi
      .get(sessionId)
      .then((data) => {
        setSessionData(data);
        // If already completed, go straight to results
        if (data.status === "completed") {
          setResult({
            xp_earned: data.xp_earned,
            correct_count: data.correct_count,
            total_count: data.total_count,
            perfect: data.correct_count === data.total_count && data.total_count > 0,
          });
          setState("complete");
        } else {
          setState("answering");
        }
      })
      .catch((e) => setError(e.message));
  }, [sessionId]);

  const currentQuiz = sessionData?.quizzes[currentIndex];

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (submitting || state !== "answering" || !currentQuiz || !sessionData) return;
      setSelectedId(optionId);
      setSubmitting(true);
      try {
        const resp = await testSessionsApi.submitAnswer(sessionId, currentQuiz.id, optionId);
        setCorrectId(resp.correct_option_id);
        setAnswers((prev) => [
          ...prev,
          {
            quizId: currentQuiz.id,
            answer: optionId,
            isCorrect: resp.is_correct,
            xpEarned: resp.xp_earned,
            correctOptionId: resp.correct_option_id,
            explanation: resp.explanation,
            detail: resp.detail,
          },
        ]);
        setState("feedback");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to submit");
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, state, currentQuiz, sessionData, sessionId]
  );

  const handleContinue = useCallback(async () => {
    if (!sessionData) return;
    const nextIndex = currentIndex + 1;
    setSelectedId(null);
    setCorrectId(null);

    if (nextIndex >= sessionData.quizzes.length) {
      try {
        const res = await testSessionsApi.complete(sessionId);
        setResult(res);
        setState("complete");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to complete");
      }
    } else {
      setCurrentIndex(nextIndex);
      setState("answering");
    }
  }, [currentIndex, sessionData, sessionId]);

  if (error) return (
    <div className="text-center py-20 text-red-500 font-semibold">{error}</div>
  );

  if (state === "loading" || !sessionData) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
    </div>
  );

  if (state === "complete" && result) {
    const pct = result.total_count > 0 ? Math.round((result.correct_count / result.total_count) * 100) : 0;
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <div className="text-6xl">{result.perfect ? "🏆" : pct >= 60 ? "🎉" : "💪"}</div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">{pct}%</h1>
          <p className="text-gray-500 mt-1">{sessionData.plan_title}</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Correct answers</span>
            <span className="font-bold text-gray-900">{result.correct_count}/{result.total_count}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">XP earned</span>
            <span className="font-bold text-yellow-600">⭐ {result.xp_earned}</span>
          </div>
          {result.perfect && (
            <div className="text-center text-yellow-600 font-bold text-sm pt-1">
              Perfect score!
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/my-tests/${sessionData.test_plan_id}`)}
            className="flex-1 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors"
          >
            View History
          </button>
          <button
            onClick={() => router.push("/my-tests")}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            My Tests
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuiz) return null;

  const lastAnswer = answers.find((a) => a.quizId === currentQuiz.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-bold text-purple-600">{sessionData.plan_title}</p>
      </div>

      {/* Progress */}
      <QuizProgressBar current={currentIndex} total={sessionData.quizzes.length} />

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuiz.id}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl border-2 border-gray-200 p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {currentQuiz.type === "TRUE_FALSE" ? "True or False" : "Multiple Choice"}
            </span>
            <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              ⭐ {currentQuiz.xp_reward} XP
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 leading-snug">{currentQuiz.question}</h2>

          {currentQuiz.type === "TRUE_FALSE" ? (
            <TrueFalseQuestion
              quiz={currentQuiz}
              selectedAnswer={selectedId}
              correctAnswer={correctId}
              onSelect={handleSelect}
              disabled={state === "feedback" || submitting}
            />
          ) : (
            <MultipleChoiceQuestion
              quiz={currentQuiz}
              selectedId={selectedId}
              correctId={correctId}
              onSelect={handleSelect}
              disabled={state === "feedback" || submitting}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback */}
      {state === "feedback" && lastAnswer && (
        <AnswerFeedback
          isCorrect={lastAnswer.isCorrect}
          explanation={lastAnswer.explanation}
          detail={lastAnswer.detail}
          xpEarned={lastAnswer.xpEarned}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
