"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DailySet } from "@/types";
import { dailySetApi, bookmarksApi } from "@/lib/api";
import { useQuizSession } from "@/hooks/useQuizSession";
import { QuizProgressBar } from "./ProgressBar";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { TrueFalseQuestion } from "./TrueFalseQuestion";
import { AnswerFeedback } from "./AnswerFeedback";
import { CompletionScreen } from "./CompletionScreen";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-50 text-green-700",
  intermediate: "bg-blue-50 text-blue-700",
  advanced: "bg-purple-50 text-purple-700",
};

// Timer component
function QuizTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const pct = (remaining / seconds) * 100;
  const color = remaining <= 5 ? "#ef4444" : remaining <= 10 ? "#f59e0b" : "#22c55e";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {remaining}s
      </span>
    </div>
  );
}

export function QuizSession({ dailySet }: { dailySet: DailySet }) {
  const { init, quizzes, currentIndex, answers, sessionState, completionResult, recordAnswer, advance, setComplete } =
    useQuizSession();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    init(dailySet.id, dailySet.quizzes);
  }, [dailySet.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuiz = quizzes[currentIndex];

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (submitting || sessionState !== "answering" || !currentQuiz) return;
      setSelectedId(optionId);
      setSubmitting(true);
      try {
        const response = await dailySetApi.submitAnswer(dailySet.id, currentQuiz.id, optionId);
        setCorrectId(response.correct_option_id);
        recordAnswer(currentQuiz.id, optionId, response);
      } catch (err) {
        console.error("Failed to submit answer", err);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, sessionState, currentQuiz, dailySet.id, recordAnswer]
  );

  // Timer expiry — auto-submit wrong answer token
  const handleTimerExpire = useCallback(() => {
    if (sessionState !== "answering" || !currentQuiz) return;
    handleSelect("__timeout__");
  }, [sessionState, currentQuiz, handleSelect]);

  const handleContinue = useCallback(async () => {
    advance();
    setSelectedId(null);
    setCorrectId(null);

    if (currentIndex + 1 >= quizzes.length) {
      try {
        const result = await dailySetApi.complete(dailySet.id);
        setComplete(result);
      } catch (err) {
        console.error("Failed to complete set", err);
      }
    }
  }, [advance, currentIndex, quizzes.length, dailySet.id, setComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (sessionState === "feedback") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleContinue();
        }
        return;
      }
      if (sessionState !== "answering" || !currentQuiz || submitting) return;

      if (currentQuiz.type === "TRUE_FALSE") {
        if (e.key === "t" || e.key === "T" || e.key === "1") {
          const trueOpt = currentQuiz.options.find((o) => o.text.toLowerCase() === "true");
          if (trueOpt) handleSelect(trueOpt.id);
        } else if (e.key === "f" || e.key === "F" || e.key === "2") {
          const falseOpt = currentQuiz.options.find((o) => o.text.toLowerCase() === "false");
          if (falseOpt) handleSelect(falseOpt.id);
        }
      } else {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < currentQuiz.options.length) {
          handleSelect(currentQuiz.options[idx].id);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sessionState, currentQuiz, submitting, handleSelect, handleContinue]);

  const handleBookmark = async () => {
    if (!currentQuiz || bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked.has(currentQuiz.id)) {
        await bookmarksApi.remove(currentQuiz.id);
        setBookmarked((prev) => {
          const next = new Set(prev);
          next.delete(currentQuiz.id);
          return next;
        });
      } else {
        await bookmarksApi.add(currentQuiz.id);
        setBookmarked((prev) => new Set(prev).add(currentQuiz.id));
      }
    } catch {
      // silently ignore bookmark errors
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (sessionState === "complete" && completionResult) {
    return <CompletionScreen result={completionResult} />;
  }

  if (!currentQuiz) return null;

  const lastAnswer = answers.find((a) => a.quizId === currentQuiz.id);
  const isBookmarked = bookmarked.has(currentQuiz.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <QuizProgressBar current={currentIndex} total={quizzes.length} />
        {timedMode && sessionState === "answering" && (
          <QuizTimer key={currentQuiz.id} seconds={30} onExpire={handleTimerExpire} />
        )}
      </div>

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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {currentQuiz.type === "TRUE_FALSE" ? "True or False" : "Multiple Choice"}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  DIFFICULTY_COLORS[currentQuiz.difficulty] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {currentQuiz.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Timed mode toggle */}
              {sessionState === "answering" && (
                <button
                  onClick={() => setTimedMode((t) => !t)}
                  className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                    timedMode ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                  title={timedMode ? "Disable timer" : "Enable 30s timer"}
                >
                  ⏱
                </button>
              )}
              {/* Bookmark */}
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={`text-lg transition-all ${isBookmarked ? "opacity-100" : "opacity-30 hover:opacity-70"}`}
                title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
              >
                🔖
              </button>
              <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                ⭐ {currentQuiz.xp_reward} XP
              </span>
            </div>
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

          {/* Keyboard hint */}
          {sessionState === "answering" && (
            <p className="text-xs text-gray-300 text-right">
              {currentQuiz.type === "TRUE_FALSE" ? "Press T / F" : "Press 1–4 to select"}
              {" · "}Enter to continue
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback */}
      {sessionState === "feedback" && lastAnswer && (
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
