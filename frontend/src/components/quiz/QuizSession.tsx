"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DailySet } from "@/types";
import { dailySetApi } from "@/lib/api";
import { useQuizSession } from "@/hooks/useQuizSession";
import { QuizProgressBar } from "./ProgressBar";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { TrueFalseQuestion } from "./TrueFalseQuestion";
import { AnswerFeedback } from "./AnswerFeedback";
import { CompletionScreen } from "./CompletionScreen";

export function QuizSession({ dailySet }: { dailySet: DailySet }) {
  const { init, quizzes, currentIndex, answers, sessionState, completionResult, recordAnswer, advance, setComplete } =
    useQuizSession();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleContinue = useCallback(async () => {
    advance();
    setSelectedId(null);
    setCorrectId(null);

    // If we just answered the last question, complete the set
    if (currentIndex + 1 >= quizzes.length) {
      try {
        const result = await dailySetApi.complete(dailySet.id);
        setComplete(result);
      } catch (err) {
        console.error("Failed to complete set", err);
      }
    }
  }, [advance, currentIndex, quizzes.length, dailySet.id, setComplete]);

  if (sessionState === "complete" && completionResult) {
    return <CompletionScreen result={completionResult} />;
  }

  if (!currentQuiz) return null;

  const lastAnswer = answers.find((a) => a.quizId === currentQuiz.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <QuizProgressBar current={currentIndex} total={quizzes.length} />

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

      {/* Feedback */}
      {sessionState === "feedback" && lastAnswer && (
        <AnswerFeedback
          isCorrect={lastAnswer.isCorrect}
          explanation={lastAnswer.explanation}
          xpEarned={lastAnswer.xpEarned}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
