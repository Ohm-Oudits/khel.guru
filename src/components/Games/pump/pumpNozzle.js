/** Balloon width at 100% scale (px). */
export const BALLOON_WIDTH_MIN = 42;

/** Resting visual scale (50% of full size — 25% was too small to read). */
const REST_SCALE = 0.5;

/** Each pump adds this much scale (25 percentage points). */
const PUMP_INCREMENT = 0.25;

/** Hard cap at 200%. */
const MAX_SCALE = 2.0;

/** 0-based pump count where visual growth stops (200% reached). */
export const BALLOON_MAX_GROWTH_PUMP_INDEX = Math.ceil(
  (MAX_SCALE - REST_SCALE) / PUMP_INCREMENT
);

/** Visual size multiplier from pumps taken (0-based index). */
export const getBalloonVisualScale = (pumpIndex) => {
  const pumps = Math.max(0, Math.floor(pumpIndex));
  return Math.min(MAX_SCALE, REST_SCALE + pumps * PUMP_INCREMENT);
};

/** 0–1 fill for color / neck / hose styling. */
export const getBalloonVisualFill = (_multiplier, _ladder, pumpIndex) => {
  const scale = getBalloonVisualScale(pumpIndex);
  if (scale <= REST_SCALE) return 0;
  return Math.min(1, (scale - REST_SCALE) / (MAX_SCALE - REST_SCALE));
};

export const canBalloonGrowVisually = (pumpIndex) =>
  getBalloonVisualScale(pumpIndex) < MAX_SCALE - 0.001;

/** Distance from the bottom of the game stage to the pump base. */
export const PUMP_BOTTOM_OFFSET = 10;
