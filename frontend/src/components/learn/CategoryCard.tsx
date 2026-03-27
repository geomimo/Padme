"use client";
import type { Category } from "@/types";

interface Props {
  category: Category;
  onClick: () => void;
  selected: boolean;
}

export function CategoryCard({ category, onClick, selected }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-5 transition-all hover:scale-105 active:scale-95 ${
        selected
          ? "border-white shadow-lg scale-105"
          : "border-white/30 hover:border-white/60"
      }`}
      style={{ backgroundColor: category.color ? `${category.color}22` : "#f3f4f6", borderColor: category.color ?? "#e5e7eb" }}
    >
      <div className="text-4xl mb-2">{category.icon ?? "📦"}</div>
      <div className="font-bold text-gray-900">{category.name}</div>
      <div className="text-xs text-gray-500 mt-1">{category.lesson_count} lessons</div>
    </button>
  );
}
