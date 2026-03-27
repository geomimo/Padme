"use client";
import { motion } from "framer-motion";

interface Props {
  streak: number;
  longestStreak: number;
  completedToday: boolean;
}

export function StreakCard({ streak, longestStreak, completedToday }: Props) {
  return (
    <div className="bg-white rounded-3xl border-2 border-orange-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-700">Streak</h3>
        <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
          Best: {longestStreak} days
        </span>
      </div>
      <div className="flex items-center gap-4">
        <motion.div
          animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-5xl"
        >
          {completedToday ? "🔥" : "💤"}
        </motion.div>
        <div>
          <div className="text-4xl font-extrabold text-orange-500">{streak}</div>
          <div className="text-sm text-gray-500 font-medium">
            {streak === 1 ? "day" : "days"}{" "}
            {!completedToday && <span className="text-red-400 font-bold">— at risk!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
