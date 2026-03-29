"use client";
import { useEffect, useState, useMemo } from "react";
import { categoriesApi, lessonsApi, progressApi } from "@/lib/api";
import type { Category, Lesson, LessonProgressOut } from "@/types";
import { CategoryCard } from "@/components/learn/CategoryCard";
import { LessonCard } from "@/components/learn/LessonCard";

export default function LearnPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressOut[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      categoriesApi.list(),
      progressApi.get(),
    ]).then(([cats, prog]) => {
      setCategories(cats);
      setLessonProgress(prog.lessons);
      if (cats.length > 0) setSelectedCat(cats[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCat) {
      lessonsApi.list(selectedCat).then(setLessons).catch(console.error);
    }
  }, [selectedCat]);

  const progressMap = useMemo(() => {
    const map: Record<string, LessonProgressOut> = {};
    for (const p of lessonProgress) {
      map[p.lesson_id] = p;
    }
    return map;
  }, [lessonProgress]);

  const filteredLessons = useMemo(() => {
    if (!search.trim()) return lessons;
    const q = search.toLowerCase();
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.description ?? "").toLowerCase().includes(q)
    );
  }, [lessons, search]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Learn</h1>
        <p className="text-gray-500 mt-1">Explore Databricks topics</p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            selected={selectedCat === cat.id}
            onClick={() => { setSelectedCat(cat.id); setSearch(""); }}
          />
        ))}
      </div>

      {/* Lessons list */}
      {selectedCat && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-bold text-gray-700">
              {categories.find((c) => c.id === selectedCat)?.name} Lessons
            </h2>
            {/* Search input */}
            <input
              type="text"
              placeholder="Search lessons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm border-2 border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-green-400 w-48"
            />
          </div>
          <div className="space-y-3">
            {filteredLessons.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                {search ? `No lessons matching "${search}".` : "No lessons yet."}
              </p>
            ) : (
              filteredLessons.map((lesson) => {
                const prog = progressMap[lesson.id];
                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    correctAnswers={prog?.correct_answers}
                    totalQuizzes={prog?.total_quizzes}
                    completionPct={prog?.completion_pct}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
