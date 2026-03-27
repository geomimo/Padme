"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { lessonsApi, categoriesApi } from "@/lib/api";
import type { Lesson, Category } from "@/types";
import { Button } from "@/components/ui/button";

export default function LessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    lessonsApi.get(lessonId).then((l) => {
      setLesson(l);
      categoriesApi.get(l.category_id).then(setCategory).catch(console.error);
    }).catch(console.error);
  }, [lessonId]);

  if (!lesson) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/learn" className="text-sm text-gray-400 hover:text-gray-600 font-medium inline-flex items-center gap-1">
        ← Back to Learn
      </Link>

      <div
        className="rounded-3xl p-8 text-white"
        style={{ backgroundColor: category?.color ?? "#4f46e5" }}
      >
        <div className="text-4xl mb-3">{category?.icon ?? "📚"}</div>
        <h1 className="text-2xl font-extrabold">{lesson.title}</h1>
        {lesson.description && <p className="mt-2 opacity-80">{lesson.description}</p>}
        <div className="mt-4 text-sm opacity-70">{lesson.quiz_count} quizzes in this lesson</div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <p className="text-gray-600 text-sm leading-relaxed">
          Quizzes from this lesson will appear in your daily set. Complete your daily set each day to practice this topic and earn XP.
        </p>
      </div>

      <Link href="/dashboard">
        <Button size="lg" className="w-full">
          Go to Today&apos;s Quiz
        </Button>
      </Link>
    </div>
  );
}
