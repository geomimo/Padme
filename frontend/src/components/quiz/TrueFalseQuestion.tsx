"use client";
import { cn } from "@/lib/utils";
import type { QuizPublic } from "@/types";

interface Props {
  quiz: QuizPublic;
  selectedAnswer: string | null; // "True" or "False"
  correctAnswer: string | null;  // The correct option text
  onSelect: (optionId: string) => void;
  disabled: boolean;
}

export function TrueFalseQuestion({ quiz, selectedAnswer, correctAnswer, onSelect, disabled }: Props) {
  const opts = [...quiz.options].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-2 gap-4">
      {opts.map((opt) => {
        const isSelected = selectedAnswer === opt.id;
        const isCorrect = correctAnswer === opt.id;
        const isWrong = isSelected && correctAnswer !== null && !isCorrect;
        const isTrue = opt.text.toLowerCase() === "true";

        return (
          <button
            key={opt.id}
            onClick={() => !disabled && onSelect(opt.id)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 font-bold text-lg transition-all",
              disabled ? "cursor-not-allowed" : "hover:scale-105 active:scale-95",
              !isSelected && !isCorrect && "border-gray-200 bg-white text-gray-700",
              isCorrect && disabled && "border-green-500 bg-green-50 text-green-800",
              isWrong && "border-red-400 bg-red-50 text-red-700",
              isSelected && !isWrong && correctAnswer === null && "border-blue-400 bg-blue-50 text-blue-800"
            )}
          >
            <span className="text-4xl">{isTrue ? "✅" : "❌"}</span>
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}
