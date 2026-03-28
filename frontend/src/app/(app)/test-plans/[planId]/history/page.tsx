"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { testPlansApi } from "@/lib/api";
import type { TestPlanDetail, TestSessionHistory } from "@/types";

export default function PlanHistoryPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [plan, setPlan] = useState<TestPlanDetail | null>(null);
  const [sessions, setSessions] = useState<TestSessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!planId) return;
    Promise.all([testPlansApi.get(planId), testPlansApi.listSessions(planId)])
      .then(([p, s]) => {
        setPlan(p);
        setSessions(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [planId]);

  if (!user) return null;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-20 text-red-500 font-semibold">{error}</div>
  );

  if (!plan) return null;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-700",
      in_progress: "bg-yellow-100 text-yellow-700",
    };
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-500"}`}>
        {status === "in_progress" ? "In Progress" : "Completed"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{plan.title}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Session history · {plan.item_count} quizzes</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-semibold">No sessions yet.</p>
          <p className="text-sm mt-1">The user hasn&apos;t started this test plan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, idx) => {
            const pct = session.total_count > 0
              ? Math.round((session.correct_count / session.total_count) * 100)
              : 0;
            const perfect = session.correct_count === session.total_count && session.total_count > 0;
            return (
              <div key={session.id} className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">
                        Attempt #{sessions.length - idx}
                      </span>
                      {statusBadge(session.status)}
                      {perfect && session.status === "completed" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          Perfect
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Started {new Date(session.started_at).toLocaleString()}
                      {session.completed_at && (
                        <> · Completed {new Date(session.completed_at).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-2xl font-extrabold text-gray-900">{pct}%</div>
                    <div className="text-xs text-gray-400">
                      {session.correct_count}/{session.total_count} correct
                    </div>
                    <div className="text-xs text-yellow-600 font-semibold">⭐ {session.xp_earned} XP</div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-yellow-400" : pct >= 60 ? "bg-green-400" : "bg-red-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Per-question answers */}
                {session.answers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Answers</p>
                    {session.answers.map((ans) => {
                      const q = plan.items.find((i) => i.quiz_id === ans.quiz_id);
                      return (
                        <div
                          key={ans.quiz_id}
                          className={`flex items-start gap-2 p-2 rounded-xl text-sm ${ans.is_correct ? "bg-green-50" : "bg-red-50"}`}
                        >
                          <span className="mt-0.5">{ans.is_correct ? "✅" : "❌"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 leading-snug">
                              {q?.question ?? ans.quiz_id}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Answer: {ans.answer}</p>
                          </div>
                          {ans.is_correct && (
                            <span className="text-xs font-bold text-yellow-600 shrink-0">+{ans.xp_earned} XP</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
