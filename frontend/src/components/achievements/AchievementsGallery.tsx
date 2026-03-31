"use client";
import type { Achievement } from "@/types";

interface Props {
  achievements: Achievement[];
}

export function AchievementsGallery({ achievements }: Props) {
  const earned = achievements.filter((a) => a.earned);
  const locked = achievements.filter((a) => !a.earned);

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-700">Achievements</h3>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {earned.length}/{achievements.length} earned
        </span>
      </div>

      {earned.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Earned</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {earned.map((ach) => (
              <div
                key={ach.id}
                className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-3 text-center"
                title={ach.description}
              >
                <div className="text-3xl mb-1">{ach.icon}</div>
                <div className="text-xs font-bold text-gray-800 leading-tight">{ach.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{ach.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Locked</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {locked.map((ach) => (
              <div
                key={ach.id}
                className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-3 text-center opacity-60"
                title={ach.description}
              >
                <div className="text-3xl mb-1 grayscale">{ach.icon}</div>
                <div className="text-xs font-bold text-gray-500 leading-tight">{ach.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-tight">{ach.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
