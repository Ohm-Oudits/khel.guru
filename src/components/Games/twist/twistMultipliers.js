/**
 * Twist wheel multipliers — segment index 0 starts at 12 o'clock, clockwise.
 * Purple: 8 segments (outer), Orange: 6 (middle), Green: 4 (inner).
 *
 * Board value is the sum of each ring's current-step multiplier.
 * Progress N lights segments 0..N-1 and pays values[N-1].
 */
export const TWIST_RING_MULTIPLIERS = {
  purple: ["3.9X", "12.5X", "28X", "52X", "85X", "133X", "200X", "300X"],
  orange: ["2.5X", "7.7X", "16X", "27.5X", "44X", "64X"],
  green: ["1.55X", "4.85X", "10X", "17X"],
};

export const TWIST_RING_VALUES = {
  purple: [3.9, 12.5, 28, 52, 85, 133, 200, 300],
  orange: [2.5, 7.7, 16, 27.5, 44, 64],
  green: [1.55, 4.85, 10, 17],
};

export const TWIST_RING_MAX = {
  purple: TWIST_RING_VALUES.purple.length,
  orange: TWIST_RING_VALUES.orange.length,
  green: TWIST_RING_VALUES.green.length,
};

export const TWIST_RING_ORDER = ["purple", "orange", "green"];

export const ringMultiplier = (color, progress) => {
  const values = TWIST_RING_VALUES[color];
  if (!values || progress <= 0) return 0;
  const idx = Math.min(progress, values.length) - 1;
  return values[idx];
};

export const boardMultiplier = ({ green = 0, orange = 0, purple = 0 }) =>
  ringMultiplier("green", green) +
  ringMultiplier("orange", orange) +
  ringMultiplier("purple", purple);

export const computeBoardPayout = (stake, progress) => {
  const amount = Number(stake) || 0;
  return amount * boardMultiplier(progress);
};

export const clampRingProgress = (color, next) =>
  Math.max(0, Math.min(TWIST_RING_MAX[color], next));

/** Drop each gem one step so some progress remains on the board. */
export const reduceBoardProgress = ({ green = 0, orange = 0, purple = 0 }) => ({
  green: Math.max(0, green - 1),
  orange: Math.max(0, orange - 1),
  purple: Math.max(0, purple - 1),
});

export const formatMultiplier = (value) => {
  if (!Number.isFinite(value) || value <= 0) return "";
  const rounded = Math.round(value * 100) / 100;
  return `${Number(rounded.toFixed(2))}X`;
};

/** x the player collects on each cashout action. */
export const cashoutOdds = ({ green = 0, orange = 0, purple = 0 }) => {
  const progress = { green, orange, purple };
  const full = boardMultiplier(progress);
  const remaining = boardMultiplier(reduceBoardProgress(progress));
  const partial = Math.max(0, +(full - remaining).toFixed(4));
  const gemCount = green + orange + purple;
  return {
    full,
    partial,
    gemCount,
    showOdds: gemCount >= 1,
  };
};
