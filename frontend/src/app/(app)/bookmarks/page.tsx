"use client";
import { useEffect, useState } from "react";
import { bookmarksApi } from "@/lib/api";
import type { BookmarkedQuiz } from "@/types";
import { Button } from "@/components/ui/button";

const DIFFICULTY_COLORS = {
  beginner: "bg-green-50 text-green-700",
  intermediate: "bg-blue-50 text-blue-700",
  advanced: "bg-purple-50 text-purple-700",
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookmarksApi.list().then(setBookmarks).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleRemove = async (quizId: string) => {
    try {
      await bookmarksApi.remove(quizId);
      setBookmarks((prev) => prev.filter((b) => b.quiz_id !== quizId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Bookmarks</h1>
        <p className="text-gray-500 mt-1">Questions you&apos;ve saved for later</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">🔖</div>
          <p className="font-semibold text-gray-500">No bookmarks yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Bookmark questions during a quiz using the 🔖 button.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bm) => (
            <div key={bm.bookmark_id} className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        DIFFICULTY_COLORS[bm.difficulty] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {bm.difficulty}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {bm.type === "TRUE_FALSE" ? "True/False" : "Multiple Choice"}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{bm.question}</p>
                </div>
                <button
                  onClick={() => handleRemove(bm.quiz_id)}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-lg"
                  title="Remove bookmark"
                >
                  🗑️
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {bm.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="text-sm bg-gray-50 rounded-xl px-4 py-2 text-gray-700"
                  >
                    {opt.text}
                  </div>
                ))}
              </div>

              {bm.explanation && (
                <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                  💡 {bm.explanation}
                </p>
              )}

              {bm.detail && (
                <details className="text-sm text-gray-500">
                  <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                    Learn More
                  </summary>
                  <p className="mt-2 leading-relaxed">{bm.detail}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
