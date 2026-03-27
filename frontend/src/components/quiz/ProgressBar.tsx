import { Progress } from "@/components/ui/progress";

export function QuizProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <Progress value={pct} className="flex-1 h-4" />
      <span className="text-sm font-bold text-gray-500 whitespace-nowrap">
        {current} / {total}
      </span>
    </div>
  );
}
