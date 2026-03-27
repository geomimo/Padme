import { Progress } from "@/components/ui/progress";

const LEVEL_XP = [0, 100, 250, 500, 1000, 2000, 3500, 5000];

function getLevel(xp: number) {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) level = i + 1;
    else break;
  }
  const nextXP = LEVEL_XP[level] ?? Infinity;
  const prevXP = LEVEL_XP[level - 1] ?? 0;
  const pct = nextXP === Infinity ? 100 : Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100);
  return { level, nextXP, pct };
}

export function XPProgressBar({ xp }: { xp: number }) {
  const { level, nextXP, pct } = getLevel(xp);
  return (
    <div className="bg-white rounded-3xl border-2 border-yellow-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700">Experience</h3>
        <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
          Level {level}
        </span>
      </div>
      <div className="text-3xl font-extrabold text-yellow-500 mb-3">⭐ {xp} XP</div>
      <Progress value={pct} className="h-4 bg-yellow-100 [&>div]:bg-yellow-400" />
      <p className="text-xs text-gray-400 mt-2 font-medium">
        {nextXP === Infinity ? "Max level!" : `${nextXP - xp} XP to level ${level + 1}`}
      </p>
    </div>
  );
}
