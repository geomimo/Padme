import Link from "next/link";
import type { Lesson } from "@/types";

export function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <Link href={`/learn/${lesson.id}`}>
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-green-400 hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div>
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
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              ✓ Available
            </span>
          ) : (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Coming soon
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
