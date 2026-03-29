"use client";
import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { reviewApi } from "@/lib/api";
import type { ReviewSession } from "@/types";
import { useReviewSession } from "@/hooks/useReviewSession";
import { MultipleChoiceQuestion } from "@/components/quiz/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "@/components/quiz/TrueFalseQuestion";
import { QuizProgressBar } from "@/components/quiz/ProgressBar";
import { Button } from "@/components/ui/button";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-50 text-green-700",
  intermediate: "bg-blue-50 text-blue-700",
  advanced: "bg-purple-50 text-purple-700",
};

function ReviewCompletionScreen({ correct, total, onBack }: { correct: number; total: number; onBack: () => void }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 z-50">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="max-w-sm w-full text-center space-y-6"
      >
        <div className="text-7xl">{pct === 100 ? "🏆" : pct >= 60 ? "🎉" : "💪"}</div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Review Complete!</h1>
          <p className="text-gray-500 mt-1">{correct} / {total} correct</p>
        </div>
        <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-5">
          <div className="text-3xl font-extrabold text-blue-600">{pct}%</div>
          <div className="text-sm text-blue-500 font-medium mt-1">Accuracy</div>
        </div>
        <p className="text-sm text-gray-500">
          Your spaced-repetition schedule has been updated. Keep reviewing to retain these answers!
        </p>
        <Button size="lg" className="w-full" onClick={onBack}>
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}

export default function ReviewSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [reviewData, setReviewData] = useState<ReviewSession | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completionStats, setCompletionStats] = useState<{ correct: number; total: number } | null>(null);
  const router = useRouter();

  const { init, quizzes, currentIndex, answers, sessionState, recordAnswer, advance } =
    useReviewSession();

  useEffect(() => {
    reviewApi.get(sessionId).then((data) => {
      setReviewData(data);
      init(data.id, data.quizzes);
    }).catch(console.error);
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuiz = quizzes[currentIndex];

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (submitting || sessionState !== "answering" || !currentQuiz) return;
      setSelectedId(optionId);
      setSubmitting(true);
      try {
        const response = await reviewApi.submitAnswer(sessionId, currentQuiz.id, optionId);
        setCorrectId(response.correct_option_id);
        recordAnswer(currentQuiz.id, optionId, response);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, sessionState, currentQuiz, sessionId, recordAnswer]
  );

  const handleContinue = useCallback(async () => {
    advance();
    setSelectedId(null);
    setCorrectId(null);

    if (currentIndex + 1 >= quizzes.length) {
      try {
        const result = await reviewApi.complete(sessionId);
        setCompletionStats({ correct: result.correct_count, total: result.total_count });
      } catch (err) {
        console.error(err);
      }
    }
  }, [advance, currentIndex, quizzes.length, sessionId]);

  if (completionStats) {
    return (
      <ReviewCompletionScreen
        correct={completionStats.correct}
        total={completionStats.total}
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  if (!currentQuiz) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const lastAnswer = answers.find((a) => a.quizId === currentQuiz.id);

  return (
    <div className="py-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            🔄 Review Mode
          </span>
        </div>

        <QuizProgressBar current={currentIndex} total={quizzes.length} />

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
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  DIFFICULTY_COLORS[currentQuiz.difficulty] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {currentQuiz.difficulty}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 leading-snug">{currentQuiz.question}</h2>

            {currentQuiz.type === "TRUE_FALSE" ? (
              <TrueFalseQuestion
                quiz={currentQuiz}
                selectedAnswer={selectedId}
                correctAnswer={correctId}
                onSelect={handleSelect}
                disabled={sessionState === "feedback" || submitting}
              />
            ) : (
              <MultipleChoiceQuestion
                quiz={currentQuiz}
                selectedId={selectedId}
                correctId={correctId}
                onSelect={handleSelect}
                disabled={sessionState === "feedback" || submitting}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {sessionState === "feedback" && lastAnswer && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`rounded-3xl p-6 border-2 space-y-3 ${
              lastAnswer.isCorrect
                ? "bg-green-50 border-green-400 text-green-900"
                : "bg-red-50 border-red-400 text-red-900"
            }`}
          >
            <div className="font-extrabold text-lg">
              {lastAnswer.isCorrect ? "🎉 Correct!" : "😮 Incorrect"}
            </div>
            {lastAnswer.explanation && (
              <p className="text-sm leading-relaxed opacity-80">{lastAnswer.explanation}</p>
            )}
            {lastAnswer.detail && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium opacity-70 hover:opacity-100">
                  Learn More
                </summary>
                <p className="mt-2 leading-relaxed opacity-70">{lastAnswer.detail}</p>
              </details>
            )}
            <Button
              onClick={handleContinue}
              variant={lastAnswer.isCorrect ? "default" : "destructive"}
              className="w-full"
            >
              Continue
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
