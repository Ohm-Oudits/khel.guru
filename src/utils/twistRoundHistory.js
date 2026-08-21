const STORAGE_KEY = "khel.twist.roundHistory";
const MAX_ROUNDS = 20;

export const saveTwistRoundRecord = (record) => {
  if (typeof window === "undefined" || !record) {
    return;
  }

  const existing = loadTwistRoundHistory();
  const next = [
    {
      ...record,
      savedAt: new Date().toISOString(),
    },
    ...existing.filter(
      (item) =>
        !(item.nonce === record.nonce && item.clientSeed === record.clientSeed)
    ),
  ].slice(0, MAX_ROUNDS);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const loadTwistRoundHistory = () => {
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
