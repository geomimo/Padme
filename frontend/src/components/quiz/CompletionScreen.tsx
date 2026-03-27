"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import type { CompleteResponse } from "@/types";
import { Button } from "@/components/ui/button";

export function CompletionScreen({ result }: { result: CompleteResponse }) {
  const router = useRouter();

  useEffect(() => {
    if (result.correct_count > 0) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }
  }, [result.correct_count]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 z-50">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="max-w-sm w-full text-center space-y-6"
      >
        <div className="text-7xl">{result.perfect_set ? "🏆" : result.correct_count > 0 ? "🎉" : "😤"}</div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {result.perfect_set ? "Perfect set!" : "Set complete!"}
          </h1>
          <p className="text-gray-500 mt-1">
            {result.correct_count} / {result.total_count} correct
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-200">
            <div className="text-2xl font-extrabold text-yellow-600">+{result.xp_earned}</div>
            <div className="text-xs font-semibold text-yellow-500 mt-1">XP Earned</div>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-200">
            <div className="text-2xl font-extrabold text-orange-600">🔥 {result.streak}</div>
            <div className="text-xs font-semibold text-orange-500 mt-1">Day Streak</div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="text-2xl font-extrabold text-blue-600">{result.new_total_xp}</div>
            <div className="text-xs font-semibold text-blue-500 mt-1">Total XP</div>
          </div>
        </div>

        {result.perfect_set && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-100 text-yellow-800 font-bold rounded-2xl px-4 py-3 text-sm"
          >
            🌟 Perfect set bonus! +20 XP
          </motion.div>
        )}

        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
