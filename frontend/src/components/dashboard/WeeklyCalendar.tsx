import type { DayActivity } from "@/types";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

export function WeeklyCalendar({ activity }: { activity: DayActivity[] }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
      <h3 className="font-bold text-gray-700 mb-4">This Week</h3>
      <div className="grid grid-cols-7 gap-2">
        {activity.map(({ date, completed }) => {
          const isToday = date === today;
          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">{dayOfWeek(date)}</span>
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  completed && "bg-green-500 text-white shadow-[0_2px_0_#16a34a]",
                  !completed && isToday && "bg-yellow-100 border-2 border-yellow-400 text-yellow-600 animate-pulse",
                  !completed && !isToday && "bg-gray-100 text-gray-400"
                )}
              >
                {completed ? "✓" : isToday ? "!" : "·"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
