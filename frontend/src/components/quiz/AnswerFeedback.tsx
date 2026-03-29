"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Props {
  isCorrect: boolean;
  explanation: string | null;
  detail: string | null;
  xpEarned: number;
  onContinue: () => void;
}

export function AnswerFeedback({ isCorrect, explanation, detail, xpEarned, onContinue }: Props) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`rounded-3xl p-6 border-2 space-y-4 ${
          isCorrect
            ? "bg-green-50 border-green-400 text-green-900"
            : "bg-red-50 border-red-400 text-red-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-lg">
            {isCorrect ? "🎉 Correct!" : "😮 Incorrect"}
          </div>
          {isCorrect && xpEarned > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-yellow-100 text-yellow-700 font-bold text-sm px-3 py-1 rounded-full"
            >
              +{xpEarned} XP
            </motion.span>
          )}
        </div>

        {explanation && (
          <p className="text-sm leading-relaxed opacity-80">{explanation}</p>
        )}

        {detail && (
          <div>
            <button
              onClick={() => setShowDetail((s) => !s)}
              className={`text-sm font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity ${
                isCorrect ? "text-green-800" : "text-red-800"
              }`}
            >
              {showDetail ? "▲ Hide detail" : "▼ Learn More"}
            </button>
            <AnimatePresence>
              {showDetail && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm leading-relaxed opacity-70 mt-2 overflow-hidden"
                >
                  {detail}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        <Button
          onClick={onContinue}
          variant={isCorrect ? "default" : "destructive"}
          className="w-full"
        >
          Continue
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
