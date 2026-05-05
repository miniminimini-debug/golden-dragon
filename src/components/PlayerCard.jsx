import { calcWeekTotal } from '../utils/points.js';
import { calcGoalProbability } from '../utils/probability.js';

export const PLAYER_META = {
  emiliano: { label: 'Emiliano', emoji: '🦅', border: 'border-amber-500/40', bar: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500' },
  nico: { label: 'Nico', emoji: '🦁', border: 'border-blue-500/40', bar: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500' },
  bruno: { label: 'Bruno', emoji: '🐉', border: 'border-emerald-500/40', bar: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500' },
};

export default function PlayerCard({ playerKey, weekData, onClick }) {
  const meta = PLAYER_META[playerKey];
  const total = calcWeekTotal(playerKey, weekData);
  const goal = weekData?.goals?.[playerKey] ?? 0;
  const prob = calcGoalProbability(playerKey, weekData);
  const progress = goal > 0 ? Math.min(100, (total / goal) * 100) : 0;

  const probColor = prob >= 70 ? 'text-emerald-400' : prob >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div
      className={`bg-zinc-900 border ${meta.border} rounded-xl p-4 cursor-pointer active:scale-95 transition-transform`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <span className={`font-bold text-base ${meta.text}`}>{meta.label}</span>
        </div>
        <span className="text-2xl font-black text-white">{total.toFixed(1)}</span>
      </div>

      <div className="mb-1 flex justify-between text-xs text-zinc-500">
        <span>Goal: {goal} pts</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div className={`h-full ${meta.bar} transition-all`} style={{ width: `${progress}%` }} />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">Probability</span>
        <span className={`font-bold ${probColor}`}>{prob}%</span>
      </div>
    </div>
  );
}
