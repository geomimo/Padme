"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { progressApi, achievementsApi } from "@/lib/api";
import type { Progress, Achievement } from "@/types";
import { Badge } from "@/components/ui/badge";
import { AchievementsGallery } from "@/components/achievements/AchievementsGallery";

export default function ProfilePage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    progressApi.get().then(setProgress).catch(console.error);
    achievementsApi.list().then(setAchievements).catch(console.error);
  }, []);

  if (!user) return null;

  const streakFreezes = progress?.streak_freezes ?? user.streak_freezes ?? 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Your learning journey</p>
      </div>

      {/* User info */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-2xl font-extrabold text-white">
          {(user.name ?? user.email)[0].toUpperCase()}
        </div>
        <div>
          <div className="font-extrabold text-gray-900 text-lg">{user.name ?? "Learner"}</div>
          <div className="text-gray-500 text-sm">{user.email}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="xp">⭐ {progress?.xp ?? user.xp} XP</Badge>
            <Badge variant="streak">🔥 {progress?.streak ?? user.streak} streak</Badge>
            {streakFreezes > 0 && (
              <Badge variant="secondary">❄️ {streakFreezes} freeze{streakFreezes > 1 ? "s" : ""}</Badge>
            )}
            {user.role === "admin" && <Badge variant="secondary">Admin</Badge>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Current Streak", value: `${progress?.streak ?? user.streak} days`, icon: "🔥", color: "border-orange-200 bg-orange-50" },
          { label: "Longest Streak", value: `${progress?.longest_streak ?? user.longest_streak} days`, icon: "🏆", color: "border-yellow-200 bg-yellow-50" },
          { label: "Total XP", value: `${progress?.xp ?? user.xp}`, icon: "⭐", color: "border-blue-200 bg-blue-50" },
          { label: "Last Active", value: progress?.last_active_date ?? "—", icon: "📅", color: "border-green-200 bg-green-50" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`rounded-2xl border-2 p-5 ${color}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="font-extrabold text-gray-900 text-lg">{value}</div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

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
                  <span className="text-gray-400 font-semibold">
                    {cat.correct_answers}/{cat.total_quizzes} ({cat.completion_pct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cat.completion_pct}%`,
                      backgroundColor: "#ef4444",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category progress */}
      {progress && progress.categories.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
          <h3 className="font-bold text-gray-700 mb-4">Progress by Topic</h3>
          <div className="space-y-3">
            {progress.categories.map((cat) => (
              <div key={cat.category_id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    {cat.icon} {cat.category_name}
                    {cat.is_mastered && (
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                        ⭐ Mastered
                      </span>
                    )}
                  </span>
                  <span className="text-gray-400 font-semibold">
                    {cat.correct_answers}/{cat.total_quizzes} ({cat.completion_pct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cat.completion_pct}%`,
                      backgroundColor: cat.is_mastered ? "#eab308" : (cat.color ?? "#22c55e"),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && <AchievementsGallery achievements={achievements} />}
    </div>
  );
}
