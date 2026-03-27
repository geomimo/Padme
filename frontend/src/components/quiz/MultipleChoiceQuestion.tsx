"use client";
import { cn } from "@/lib/utils";
import type { QuizPublic } from "@/types";

interface Props {
  quiz: QuizPublic;
  selectedId: string | null;
  correctId: string | null;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}

export function MultipleChoiceQuestion({ quiz, selectedId, correctId, onSelect, disabled }: Props) {
  return (
    <div className="space-y-3">
      {quiz.options.map((opt) => {
        const isSelected = selectedId === opt.id;
        const isCorrect = correctId === opt.id;
        const isWrong = isSelected && correctId !== null && !isCorrect;

        return (
          <button
            key={opt.id}
            onClick={() => !disabled && onSelect(opt.id)}
            disabled={disabled}
            className={cn(
              "w-full text-left px-5 py-4 rounded-2xl border-2 font-semibold text-sm transition-all",
              disabled ? "cursor-not-allowed" : "hover:border-green-400 hover:bg-green-50 active:scale-98",
              !isSelected && !isCorrect && "border-gray-200 bg-white text-gray-800",
              isCorrect && disabled && "border-green-500 bg-green-50 text-green-800",
              isWrong && "border-red-400 bg-red-50 text-red-700",
              isSelected && !isWrong && correctId === null && "border-blue-400 bg-blue-50 text-blue-800"
            )}
          >
            <span className="mr-3">
              {disabled && isCorrect ? "✅" : disabled && isWrong ? "❌" : "○"}
            </span>
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}
