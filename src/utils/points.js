export function calcWakeUpPoints(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  const hours = h + m / 60;
  if (hours >= 12) return 0;
  const raw = Math.max(0, 4 - (hours - 8));
  return Math.round(raw * 2) / 2;
}

export function calcWorkPoints(achievedHours, goalHours) {
  if (!goalHours || goalHours <= 0) return 0;
  const ratio = Math.min(1, achievedHours / goalHours);
  return Math.round(ratio * 4 * 2) / 2;
}

export function getFoodPoints(selfPoints, votes) {
  const allVotes = [selfPoints, ...Object.values(votes || {})].filter(
    (v) => v !== null && v !== undefined
  );
  if (allVotes.length === 0) return 0;
  return Math.min(...allVotes);
}

export function calcDayTotal(entry, isDayOff) {
  if (!entry) return 0;
  const base =
    (entry.wakeUp?.points ?? 0) +
    (entry.food?.finalPoints ?? 0) +
    (entry.addiction?.points ?? 0) +
    (entry.work?.points ?? 0);
  return isDayOff ? Math.max(7, base) : base;
}

export function calcWeekTotal(playerKey, weekData) {
  if (!weekData?.days) return 0;
  return Object.entries(weekData.days).reduce((sum, [dateKey, dayEntries]) => {
    const entry = dayEntries?.[playerKey];
    if (!entry) return sum;
    const isDayOff = weekData.dayOff?.[playerKey] === dateKey;
    return sum + calcDayTotal(entry, isDayOff);
  }, 0);
}

export const MAX_DAY_POINTS = 16;
