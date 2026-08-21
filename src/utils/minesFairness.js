import { hashServerSeed, takeFairnessFloats } from "./twistFairness";

export { hashServerSeed };

export const MINES_TILES = 25;
export const MINES_EVENT_COUNT = 24;
export const MINES_RTP = 0.99;
export const MINES_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → 24 floats → Fisher-Yates on 25 tiles (left-to-right, top-to-bottom). Mines = first M unique indexes. Cashout X_K = 0.99 / Π_i=0^{K-1} (25-M-i)/(25-i)";

const clampFloat = (value) => {
  const x = Number(value);
  if (!Number.isFinite(x) || x < 0) return 0;
  return Math.min(x, 0.999999999999);
};

export const shuffleMinesFromFloats = (floats = [], mineCount) => {
  const count = Math.min(
    MINES_EVENT_COUNT,
    Math.max(1, Math.floor(Number(mineCount) || 0))
  );
  const tiles = Array.from({ length: MINES_TILES }, (_, index) => index);

  for (let i = 0; i < MINES_TILES - 1; i += 1) {
    const remaining = MINES_TILES - i;
    const offset = Math.min(
      remaining - 1,
      Math.floor(clampFloat(floats[i]) * remaining)
    );
    const j = i + offset;
    const swap = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = swap;
  }

  return tiles.slice(0, count).sort((a, b) => a - b);
};

export const minesSafeProbability = (mineCount, gemsRevealed) => {
  const mines = Number(mineCount);
  const gems = Number(gemsRevealed);
  if (
    !Number.isInteger(mines) ||
    !Number.isInteger(gems) ||
    mines < 1 ||
    mines > MINES_EVENT_COUNT ||
    gems < 1 ||
    gems > MINES_TILES - mines
  ) {
    return 0;
  }

  let probability = 1;
  for (let i = 0; i < gems; i += 1) {
    probability *= (MINES_TILES - mines - i) / (MINES_TILES - i);
  }
  return probability;
};

export const minesMultiplier = (mineCount, gemsRevealed) => {
  const gems = Number(gemsRevealed);
  if (!Number.isInteger(gems) || gems <= 0) {
    return 1;
  }
  const probability = minesSafeProbability(mineCount, gemsRevealed);
  if (probability <= 0) {
    return 0;
  }
  return MINES_RTP / probability;
};

export const settleMinesCashout = ({
  betAmount,
  mineCount,
  gemsRevealed,
}) => {
  const stake = Number(betAmount);
  const multiplier = minesMultiplier(mineCount, gemsRevealed);
  const safeStake = Number.isFinite(stake) && stake > 0 ? stake : 0;
  const payout = safeStake * (Number.isFinite(multiplier) ? multiplier : 0);
  return {
    multiplier: Number.isFinite(multiplier) ? multiplier : 0,
    payout,
    profit: payout - safeStake,
    gemsRevealed: Math.max(0, Number(gemsRevealed) || 0),
  };
};

export const countRevealedDiamonds = (grid = []) =>
  (Array.isArray(grid) ? grid : []).filter(
    (tile) => Boolean(tile?.revealed) && tile?.type !== "bomb"
  ).length;

export const formatMinesMultiplier = (value) => {
  const x = Number(value);
  if (!Number.isFinite(x) || x <= 0) return "1.00";
  return x.toFixed(2);
};

export const verifyMinesLayout = async ({
  serverSeed,
  clientSeed,
  nonce,
  mineCount,
}) => {
  const floats = await takeFairnessFloats({
    serverSeed,
    clientSeed,
    nonce,
    count: MINES_EVENT_COUNT,
  });
  return {
    mines: shuffleMinesFromFloats(floats, mineCount),
    formula: MINES_FAIRNESS_FORMULA,
    eventCount: MINES_EVENT_COUNT,
    mineCount: Number(mineCount),
    serverSeedHash: await hashServerSeed(serverSeed),
  };
};
