// Week starts Wednesday (day=3), ends Tuesday (day=2).
// weekId = the Wednesday date string: "2026-05-06"

export function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export function getWeekId(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  const daysFromWed = (day + 4) % 7; // 0 on Wed, 6 on Tue
  d.setDate(d.getDate() - daysFromWed);
  return d.toISOString().split('T')[0];
}

export function getWeekStart(weekId) {
  return new Date(weekId + 'T12:00:00');
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

export function prevWeekId(weekId) {
  const d = getWeekStart(weekId);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

export function nextWeekId(weekId) {
  const d = getWeekStart(weekId);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}
