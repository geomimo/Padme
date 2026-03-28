import Link from "next/link";
import type { Lesson } from "@/types";

interface Props {
  lesson: Lesson;
  correctAnswers?: number;
  totalQuizzes?: number;
  completionPct?: number;
}

export function LessonCard({ lesson, correctAnswers, totalQuizzes, completionPct }: Props) {
  const hasProgress = totalQuizzes !== undefined && totalQuizzes > 0;
  const pct = completionPct ?? 0;
  const isMastered = pct >= 80 && hasProgress;

  return (
    <Link href={`/learn/${lesson.id}`}>
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-green-400 hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
              {lesson.title}
            </h3>
            {lesson.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lesson.description}</p>
            )}
          </div>
          <div className="shrink-0 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
            {lesson.quiz_count} Q
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          {lesson.is_published ? (
            isMastered ? (
              <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                ⭐ Mastered
              </span>
            ) : (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                ✓ Available
              </span>
            )
          ) : (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Coming soon
            </span>
          )}
        </div>

        {/* Progress bar */}
        {hasProgress && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{correctAnswers}/{totalQuizzes} correct</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isMastered ? "#eab308" : "#22c55e",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
