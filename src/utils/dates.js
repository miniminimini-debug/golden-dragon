export function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export function getWeekId(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getWeekStart(weekId) {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
  return weekStart;
}

export function getWeekDays(weekId) {
  const start = getWeekStart(weekId);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export function isWeekday(dateKey) {
  const day = new Date(dateKey + 'T12:00:00').getDay();
  return day >= 1 && day <= 5;
}

export function dayLabel(dateKey) {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export function shortDayLabel(dateKey) {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

export function weekRangeLabel(weekId) {
  const start = getWeekStart(weekId);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}
