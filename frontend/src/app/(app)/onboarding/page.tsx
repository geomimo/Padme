"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { onboardingApi } from "@/lib/api";
import type { OnboardingQuiz } from "@/types";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const [quizzes, setQuizzes] = useState<OnboardingQuiz[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    onboardingApi.getQuiz().then(setQuizzes).catch(console.error).finally(() => setLoading(false));
  }, []);

  const currentQuiz = quizzes[currentIndex];

  const handleSelect = (optionId: string) => {
    if (submitted || selectedId) return;
    setSelectedId(optionId);
    setSubmitted(true);
  };

  const handleContinue = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= quizzes.length) {
      setDone(true);
      return;
    }
    setCurrentIndex(next);
    setSelectedId(null);
    setSubmitted(false);
  }, [currentIndex, quizzes.length]);

  const handleFinish = async () => {
    await onboardingApi.complete().catch(console.error);
    router.replace("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center p-6 z-50">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="max-w-sm w-full text-center space-y-6"
        >
          <div className="text-7xl">🚀</div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">You&apos;re all set!</h1>
            <p className="text-gray-500 mt-2">
              Thanks for completing the quick assessment. Your daily quizzes are ready.
            </p>
          </div>
          <Button size="lg" className="w-full" onClick={handleFinish}>
            Start Learning
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!currentQuiz) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 font-semibold text-sm px-4 py-2 rounded-full">
            🧱 Quick Assessment — {currentIndex + 1} of {quizzes.length}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Let&apos;s see what you know!</h1>
          <p className="text-gray-500">No pressure — just getting a feel for your knowledge level.</p>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuiz.id}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl border-2 border-gray-200 p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentQuiz.category_icon ?? "📚"}</span>
              <span className="font-semibold text-gray-600">{currentQuiz.category_name}</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900">{currentQuiz.question}</h2>

            <div className="space-y-3">
              {currentQuiz.options.map((opt) => {
                const isSelected = selectedId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={!!selectedId}
                    className={`w-full text-left rounded-2xl border-2 px-4 py-3 font-medium transition-all ${
                      isSelected
                        ? "border-green-500 bg-green-50 text-green-800"
                        : selectedId
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-default"
                        : "border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer"
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {submitted && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Button size="lg" className="w-full" onClick={handleContinue}>
              {currentIndex + 1 < quizzes.length ? "Next Question" : "Finish Assessment"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
