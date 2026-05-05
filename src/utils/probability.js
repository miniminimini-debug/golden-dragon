import { calcWeekTotal, MAX_DAY_POINTS } from './points.js';
import { getWeekDays, todayKey } from './dates.js';

export function calcGoalProbability(playerKey, weekData) {
  if (!weekData) return 50;

  const total = calcWeekTotal(playerKey, weekData);
  const goal = weekData.goals?.[playerKey] ?? 70;

  if (total >= goal) return 100;

  const today = todayKey();
  const weekDays = getWeekDays(weekData.id);
  const completedDays = weekDays.filter(
    (d) => d < today && weekData.days?.[d]?.[playerKey]
  );
  const remainingDays = weekDays.filter((d) => d >= today).length;

  if (remainingDays === 0) return 0;

  const needed = goal - total;
  const maxPossible = remainingDays * MAX_DAY_POINTS;
  if (maxPossible < needed) return 0;

  const daysElapsed = completedDays.length;
  const dailyAvg = daysElapsed > 0 ? total / daysElapsed : 10;
  const projected = total + dailyAvg * remainingDays;
  const paceRatio = projected / goal;

  const prob = Math.min(95, Math.max(5, ((paceRatio - 0.7) / 0.6) * 90 + 5));
  return Math.round(prob);
}
