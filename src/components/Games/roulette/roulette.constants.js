/** Standard European roulette red pockets */
export const ROULETTE_RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

/** Wheel pocket order clockwise (matches wheel animation CSS) */
export const ROULETTE_WHEEL_ORDER = [
  32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26, 0,
];

export const ROULETTE_SEGMENT_DEG = 360 / ROULETTE_WHEEL_ORDER.length;

/** CodePen spinto pocket offsets (8 spins + calibrated d) */
export const CODEPEN_SPINTO_OFFSET = {
  0: 49, 1: 278, 2: 106, 3: 30, 4: 87, 5: 238, 6: 146, 7: 354, 8: 207, 9: 316,
  10: 228, 11: 187, 12: 12, 13: 166, 14: 298, 15: 67, 16: 258, 17: 125, 18: 335,
  19: 77, 20: 288, 21: 96, 22: 326, 23: 218, 24: 248, 25: 116, 26: 40, 27: 156,
  28: 3, 29: 345, 30: 196, 31: 307, 32: 58, 33: 268, 34: 135, 35: 381, 36: 177,
};

export const CODEPEN_SPINTO_LAP_DEG = -360 * 8;

/** Half-pocket trim so the ball settles in the pocket, not between neighbors */
export const ROULETTE_SPINTO_TRIM_DEG = ROULETTE_SEGMENT_DEG / 2;

export const getPocketWheelIndex = (pocket) =>
  ROULETTE_WHEEL_ORDER.indexOf(Number(pocket));

export const getRoulettePocketColor = (pocket) => {
  const n = Number(pocket);
  if (n === 0) return "green";
  return ROULETTE_RED_NUMBERS.includes(n) ? "red" : "black";
};

export const ROULETTE_CHIP_VALUES = [20, 50, 100, 200, 500, 1000, 5000];

export const ROULETTE_DEFAULT_CHIP = 20;

export const formatChipLabel = (value) => {
  if (value >= 1000) {
    return `${value / 1000}K`;
  }
  return String(value);
};
