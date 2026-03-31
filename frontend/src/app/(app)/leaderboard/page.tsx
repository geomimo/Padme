"use client";
import { useEffect, useState } from "react";
import { leaderboardApi } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi.get().then(setEntries).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 mt-1">Top learners by total XP</p>
      </div>

      <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden">
        {entries.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No data yet.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0 ${
                entry.is_current_user ? "bg-green-50" : ""
              }`}
            >
              {/* Rank badge */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                  entry.rank === 1
                    ? "bg-yellow-100 text-yellow-700"
                    : entry.rank === 2
                    ? "bg-gray-100 text-gray-600"
                    : entry.rank === 3
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                {entry.name[0].toUpperCase()}
              </div>

              {/* Name + streak */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 truncate">
                  {entry.name}
                  {entry.is_current_user && (
                    <span className="ml-2 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">🔥 {entry.streak} day streak</div>
              </div>

              {/* XP */}
              <div className="text-right shrink-0">
                <div className="font-extrabold text-yellow-600">⭐ {entry.xp.toLocaleString()}</div>
                <div className="text-xs text-gray-400">XP</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
