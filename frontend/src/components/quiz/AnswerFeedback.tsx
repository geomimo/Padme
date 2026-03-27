"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Props {
  isCorrect: boolean;
  explanation: string | null;
  xpEarned: number;
  onContinue: () => void;
}

export function AnswerFeedback({ isCorrect, explanation, xpEarned, onContinue }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`rounded-3xl p-6 border-2 ${
          isCorrect
            ? "bg-green-50 border-green-400 text-green-900"
            : "bg-red-50 border-red-400 text-red-900"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
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
          <p className="text-sm leading-relaxed mb-4 opacity-80">{explanation}</p>
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
