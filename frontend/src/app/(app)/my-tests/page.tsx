"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { testPlansApi } from "@/lib/api";
import type { TestPlan } from "@/types";

export default function MyTestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    testPlansApi
      .list()
      .then(setPlans)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (planId: string) => {
    setStarting(planId);
    try {
      const session = await testPlansApi.startSession(planId);
      router.push(`/test-session/${session.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start session");
      setStarting(null);
    }
  };

  if (!user) return null;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      draft: "bg-yellow-100 text-yellow-700",
      archived: "bg-gray-100 text-gray-500",
    };
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-500"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">My Tests</h1>
        <p className="text-gray-500 mt-1">Tests assigned to you by your instructor</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-semibold">No tests assigned yet.</p>
          <p className="text-sm mt-1">Your instructor will assign tests here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border-2 border-gray-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-gray-900 truncate">{plan.title}</h2>
                    {statusBadge(plan.status)}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mb-2">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>📝 {plan.item_count} quiz{plan.item_count !== 1 ? "zes" : ""}</span>
                    <span>Assigned {new Date(plan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleStart(plan.id)}
                    disabled={starting === plan.id || plan.status !== "active"}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-40"
                  >
                    {starting === plan.id ? "Starting…" : "Start Test"}
                  </button>
                  <button
                    onClick={() => router.push(`/my-tests/${plan.id}`)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-4 py-1.5 rounded-xl hover:bg-blue-50 transition-colors text-center"
                  >
                    View History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
