"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { DailySet } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  dailySet: DailySet | null;
  loading: boolean;
}

export function DailySetCard({ dailySet, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border-2 border-green-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-12 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!dailySet || dailySet.quizzes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 text-center">
        <div className="text-4xl mb-2">😴</div>
        <p className="font-semibold text-gray-500">No quizzes available today.</p>
        <p className="text-sm text-gray-400 mt-1">Ask your admin to add more content!</p>
      </div>
    );
  }

  if (dailySet.is_completed) {
    return (
      <div className="bg-green-50 rounded-3xl border-2 border-green-400 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="font-extrabold text-green-800">Today&apos;s set complete!</h3>
            <p className="text-sm text-green-600">You earned {dailySet.xp_earned} XP today. Come back tomorrow!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-3xl border-2 border-green-400 p-6 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-lg">Today&apos;s Daily Set</h3>
          <p className="text-sm text-gray-500 mt-0.5">{dailySet.quizzes.length} questions ready</p>
        </div>
        <span className="text-3xl">📝</span>
      </div>
      <Link href={`/quiz/${dailySet.id}`}>
        <Button size="lg" className="w-full">
          Start Today&apos;s Quiz
        </Button>
      </Link>
    </motion.div>
  );
}
