"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dailySetApi } from "@/lib/api";
import type { DailySet } from "@/types";
import { QuizSession } from "@/components/quiz/QuizSession";

export default function QuizPage({ params }: { params: Promise<{ dailySetId: string }> }) {
  const { dailySetId } = use(params);
  const [dailySet, setDailySet] = useState<DailySet | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    dailySetApi
      .getToday()
      .then((ds) => {
        if (ds.id !== dailySetId) {
          router.replace(`/quiz/${ds.id}`);
          return;
        }
        if (ds.is_completed) {
          router.replace("/dashboard");
          return;
        }
        if (ds.quizzes.length === 0) {
          router.replace("/dashboard");
          return;
        }
        setDailySet(ds);
      })
      .catch((e) => setError(e.message));
  }, [dailySetId, router]);

  if (error) return (
    <div className="text-center py-20 text-red-500 font-semibold">{error}</div>
  );

  if (!dailySet) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="py-4">
      <QuizSession dailySet={dailySet} />
    </div>
  );
}
