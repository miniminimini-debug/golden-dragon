const KEY = 'golden-dragon-v1';

function hasOldWeekFormat(state) {
  return Object.keys(state?.weeks || {}).some(id => /^\d{4}-W\d{2}$/.test(id));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (hasOldWeekFormat(parsed)) {
      // Old ISO week format — discard so new Wed-Tue system starts clean
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage quota exceeded or unavailable
  }
}
