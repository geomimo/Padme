"use client";
import { useEffect, useState } from "react";
import { categoriesApi, lessonsApi } from "@/lib/api";
import type { Category, Lesson } from "@/types";
import { CategoryCard } from "@/components/learn/CategoryCard";
import { LessonCard } from "@/components/learn/LessonCard";

export default function LearnPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.list().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setSelectedCat(cats[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCat) {
      lessonsApi.list(selectedCat).then(setLessons).catch(console.error);
    }
  }, [selectedCat]);

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
            onClick={() => setSelectedCat(cat.id)}
          />
        ))}
      </div>

      {/* Lessons list */}
      {selectedCat && (
        <div>
          <h2 className="font-bold text-gray-700 mb-3">
            {categories.find((c) => c.id === selectedCat)?.name} Lessons
          </h2>
          <div className="space-y-3">
            {lessons.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No lessons yet.</p>
            ) : (
              lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
