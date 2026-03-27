"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { dailySetApi, progressApi } from "@/lib/api";
import type { DailySet, Progress } from "@/types";
import { DailySetCard } from "@/components/dashboard/DailySetCard";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { XPProgressBar } from "@/components/dashboard/XPProgressBar";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";

export default function DashboardPage() {
  const { user } = useAuth();
  const [dailySet, setDailySet] = useState<DailySet | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loadingSet, setLoadingSet] = useState(true);

  useEffect(() => {
    dailySetApi
      .getToday()
      .then(setDailySet)
      .catch(console.error)
      .finally(() => setLoadingSet(false));

    progressApi.get().then(setProgress).catch(console.error);
  }, []);

  if (!user) return null;

  const completedToday = dailySet?.is_completed ?? false;

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

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StreakCard
          streak={progress?.streak ?? user.streak}
          longestStreak={progress?.longest_streak ?? user.longest_streak}
          completedToday={completedToday}
        />
        <XPProgressBar xp={progress?.xp ?? user.xp} />
      </div>

      {/* Weekly calendar */}
      {progress && <WeeklyCalendar activity={progress.weekly_activity} />}
    </div>
  );
}
