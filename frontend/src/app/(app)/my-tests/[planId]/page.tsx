"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { testPlansApi } from "@/lib/api";
import type { TestPlanDetail, TestSessionHistory } from "@/types";

export default function MyTestHistoryPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [plan, setPlan] = useState<TestPlanDetail | null>(null);
  const [sessions, setSessions] = useState<TestSessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
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

  const handleStart = async () => {
    setStarting(true);
    try {
      const session = await testPlansApi.startSession(planId);
      router.push(`/test-session/${session.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start session");
      setStarting(false);
    }
  };

  if (!user) return null;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-20 text-red-500 font-semibold">{error}</div>
  );

  if (!plan) return null;

  const bestSession = sessions
    .filter((s) => s.status === "completed" && s.total_count > 0)
    .sort((a, b) => (b.correct_count / b.total_count) - (a.correct_count / a.total_count))[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold mt-1"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900">{plan.title}</h1>
          {plan.description && (
            <p className="text-gray-500 mt-0.5 text-sm">{plan.description}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">{plan.item_count} quizzes</p>
        </div>
        <button
          onClick={handleStart}
          disabled={starting || plan.status !== "active"}
          className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 shrink-0"
        >
          {starting ? "Starting…" : sessions.length === 0 ? "Start Test" : "Retake Test"}
        </button>
      </div>

      {/* Best score summary */}
      {bestSession && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Best Score</p>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-extrabold text-green-700">
              {Math.round((bestSession.correct_count / bestSession.total_count) * 100)}%
            </div>
            <div className="text-sm text-gray-600">
              {bestSession.correct_count}/{bestSession.total_count} correct
              <span className="ml-2 text-yellow-600 font-semibold">⭐ {bestSession.xp_earned} XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Session history */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          Attempt History
          <span className="ml-2 text-sm font-normal text-gray-400">({sessions.length} attempt{sessions.length !== 1 ? "s" : ""})</span>
        </h2>

        {sessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
            <div className="text-4xl mb-3">📝</div>
            <p className="font-semibold">No attempts yet.</p>
            <p className="text-sm mt-1">Click &quot;Start Test&quot; to begin your first attempt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, idx) => {
              const pct = session.total_count > 0
                ? Math.round((session.correct_count / session.total_count) * 100)
                : 0;
              const perfect = session.correct_count === session.total_count && session.total_count > 0;
              const isInProgress = session.status === "in_progress";

              return (
                <div key={session.id} className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">
                          Attempt #{sessions.length - idx}
                        </span>
                        {isInProgress ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            In Progress
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Completed
                          </span>
                        )}
                        {perfect && !isInProgress && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            Perfect
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(session.started_at).toLocaleString()}
                      </p>

                      {!isInProgress && (
                        <>
                          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${pct === 100 ? "bg-yellow-400" : pct >= 60 ? "bg-green-400" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span>{session.correct_count}/{session.total_count} correct</span>
                            <span className="text-yellow-600 font-semibold">⭐ {session.xp_earned} XP</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isInProgress ? (
                        <button
                          onClick={() => router.push(`/test-session/${session.id}`)}
                          className="text-sm font-bold text-yellow-600 hover:text-yellow-800 px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
                        >
                          Resume
                        </button>
                      ) : (
                        <div className="text-right">
                          <div className="text-2xl font-extrabold text-gray-700">{pct}%</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Answers detail (collapsed for completed) */}
                  {!isInProgress && session.answers.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs font-bold text-gray-400 cursor-pointer hover:text-gray-600 uppercase tracking-wider">
                        Show answers
                      </summary>
                      <div className="mt-2 space-y-1.5">
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
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
