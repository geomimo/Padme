"use client";
import { useEffect, useState } from "react";
import { historyApi } from "@/lib/api";
import type { SessionHistoryItem } from "@/types";

function ScoreBar({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "#16a34a" : pct >= 60 ? "#3b82f6" : "#ef4444",
          }}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium shrink-0">
        {correct}/{total}
      </span>
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyApi.get().then(setHistory).catch(console.error).finally(() => setLoading(false));
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
        <h1 className="text-2xl font-extrabold text-gray-900">Session History</h1>
        <p className="text-gray-500 mt-1">Your last 30 completed daily sets</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-semibold text-gray-500">No completed sessions yet.</p>
          <p className="text-sm text-gray-400 mt-1">Complete your first daily set to see history here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border-2 p-5 ${
                item.perfect ? "border-yellow-300" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{item.perfect ? "🏆" : item.correct_count > 0 ? "✅" : "😤"}</div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {item.perfect && (
                        <span className="ml-2 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                          Perfect!
                        </span>
                      )}
                    </div>
                    <ScoreBar correct={item.correct_count} total={item.total_count} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-yellow-600">+{item.xp_earned}</div>
                  <div className="text-xs text-gray-400">XP</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
