const STORAGE_KEY = "khel.tower.roundHistory";
const MAX_ROUNDS = 20;

export const saveTowerRoundRecord = (record) => {
  if (typeof window === "undefined" || !record) {
    return;
  }

  const existing = loadTowerRoundHistory();
  const next = [
    {
      ...record,
      savedAt: new Date().toISOString(),
    },
    ...existing.filter((item) => item.nonce !== record.nonce),
  ].slice(0, MAX_ROUNDS);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const loadTowerRoundHistory = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearTowerRoundHistory = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};
