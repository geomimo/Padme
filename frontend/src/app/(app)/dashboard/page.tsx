"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { dailySetApi, progressApi, usersApi } from "@/lib/api";
import type { DailySet, Progress } from "@/types";
import { DailySetCard } from "@/components/dashboard/DailySetCard";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { XPProgressBar } from "@/components/dashboard/XPProgressBar";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [dailySet, setDailySet] = useState<DailySet | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loadingSet, setLoadingSet] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState(false);

  useEffect(() => {
    // Redirect new users to onboarding
    if (user && !user.onboarding_complete) {
      router.replace("/onboarding");
      return;
    }

    dailySetApi
      .getToday()
      .then(setDailySet)
      .catch(console.error)
      .finally(() => setLoadingSet(false));

    progressApi.get().then(setProgress).catch(console.error);
  }, [user, router]);

  if (!user) return null;

  const completedToday = dailySet?.is_completed ?? false;
  const streakFreezes = progress?.streak_freezes ?? user.streak_freezes ?? 0;
  const streak = progress?.streak ?? user.streak;
  const streakAtRisk = !completedToday && streak > 0;

  const handleUseFreeze = async () => {
    if (freezeLoading || streakFreezes <= 0) return;
    setFreezeLoading(true);
    try {
      await usersApi.useStreakFreeze();
      // Refresh progress
      const p = await progressApi.get();
      setProgress(p);
    } catch (err) {
      console.error(err);
    } finally {
      setFreezeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Hi {user.name ?? user.email.split("@")[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {completedToday
            ? "Great work today! See you tomorrow."
            : "Ready for today's challenge?"}
        </p>
      </div>

      {/* Daily set */}
      <DailySetCard dailySet={dailySet} loading={loadingSet} />

      {/* Streak at risk — freeze option */}
      {streakAtRisk && streakFreezes > 0 && (
        <div className="bg-blue-50 rounded-2xl border-2 border-blue-300 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-blue-800">❄️ Streak at risk!</p>
            <p className="text-sm text-blue-600 mt-0.5">
              Use a freeze to protect your {streak}-day streak for today.
              You have {streakFreezes} freeze{streakFreezes > 1 ? "s" : ""}.
            </p>
          </div>
          <button
            onClick={handleUseFreeze}
            disabled={freezeLoading}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {freezeLoading ? "..." : "Use Freeze"}
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StreakCard
          streak={streak}
          longestStreak={progress?.longest_streak ?? user.longest_streak}
          completedToday={completedToday}
        />
        <XPProgressBar xp={progress?.xp ?? user.xp} />
      </div>

      {/* Weekly calendar */}
      {progress && <WeeklyCalendar activity={progress.weekly_activity} />}

      {/* Weak areas */}
      {progress && progress.weak_areas.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
          <h3 className="font-bold text-gray-700 mb-4">Areas to Improve</h3>
          <div className="space-y-3">
            {progress.weak_areas.map((cat) => (
              <div key={cat.category_id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {cat.icon} {cat.category_name}
                  </span>
                  <span className="text-gray-400 font-semibold text-xs">
                    {cat.completion_pct}% accuracy
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.completion_pct}%`,
                      backgroundColor: cat.color ?? "#ef4444",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/review"
            className="mt-4 block text-sm text-center font-semibold text-blue-600 hover:text-blue-800"
          >
            Practice mistakes →
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/paths", icon: "🗺️", label: "Learning Paths" },
          { href: "/review", icon: "🔄", label: "Review Mistakes" },
          { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
          { href: "/history", icon: "📅", label: "History" },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl border-2 border-gray-200 p-4 text-center hover:border-green-400 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-semibold text-gray-600">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
