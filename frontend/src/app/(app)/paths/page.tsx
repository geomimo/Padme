"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { pathsApi } from "@/lib/api";
import type { LearningPath } from "@/types";

function PathCard({ path }: { path: LearningPath }) {
  const masteryPct =
    path.total_lessons > 0
      ? Math.round((path.mastered_lessons / path.total_lessons) * 100)
      : 0;

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6" style={{ backgroundColor: path.color ?? "#6366f1" }}>
        <div className="text-4xl mb-2">{path.icon ?? "🗺️"}</div>
        <h3 className="text-xl font-extrabold text-white">{path.title}</h3>
        {path.description && <p className="text-white/80 text-sm mt-1">{path.description}</p>}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
          <span className="text-white font-bold text-sm">
            {path.mastered_lessons}/{path.total_lessons} mastered
          </span>
        </div>
      </div>

      {/* Lessons */}
      <div className="divide-y divide-gray-100">
        {path.lessons.map((lesson, idx) => (
          <div key={lesson.item_id} className="px-6 py-4 flex items-center gap-4">
            {/* Step number */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                lesson.is_mastered
                  ? "bg-green-100 text-green-700"
                  : lesson.total_quizzes > 0
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {lesson.is_mastered ? "✓" : idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/learn/${lesson.lesson_id}`}>
                <p className="font-semibold text-gray-900 hover:text-green-600 transition-colors truncate">
                  {lesson.title}
                </p>
              </Link>
              {lesson.total_quizzes > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${lesson.completion_pct}%`,
                        backgroundColor: lesson.is_mastered ? "#16a34a" : "#3b82f6",
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{lesson.completion_pct}%</span>
                </div>
              )}
            </div>
            {lesson.is_mastered && (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                Mastered
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pathsApi.list().then(setPaths).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Learning Paths</h1>
        <p className="text-gray-500 mt-1">Structured tracks to guide your Databricks mastery</p>
      </div>

      {paths.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-semibold text-gray-500">No learning paths available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>
      )}
    </div>
  );
}
