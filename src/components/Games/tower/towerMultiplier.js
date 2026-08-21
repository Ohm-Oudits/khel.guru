export const TOWER_MAX_MULTIPLIERS = {
  Easy: 1.5,
  Medium: 2,
  Hard: 3,
  Extreme: 4,
  Nightmare: 5,
};

/** Multiplier after successfully clearing `rowIndex` (matches checkout progress). */
export const getTowerRowMultiplier = (difficulty, rowIndex, rows = 9) => {
  const maxMult = TOWER_MAX_MULTIPLIERS[difficulty] ?? 1.5;
  const completedAfterPick = rows - rowIndex;
  return maxMult * (completedAfterPick / rows);
};

export const formatTowerMultiplier = (value) => {
  const rounded = Math.floor(Number(value) * 100) / 100;
  return rounded.toFixed(2);
};

export const getTowerProgress = ({ currentRow, rows = 9, selectedBoxes = [] }) => {
  if (currentRow != null && Number.isFinite(Number(currentRow))) {
    return Math.max(0, rows - Number(currentRow) - 1);
  }

  return selectedBoxes.filter((box) => box.correct).length;
};

export const computeTowerProgressMultiplier = (
  difficulty,
  progress,
  rows = 9
) => {
  const maxMult = TOWER_MAX_MULTIPLIERS[difficulty] ?? 1.5;
  return maxMult * (Math.max(0, progress) / rows);
};

export const computeTowerEndMultiplier = ({
  difficulty,
  rows = 9,
  gameWon = false,
  gameOver = false,
  checkedOut = false,
  profit = 0,
  betAmount = 0,
  selectedBoxes = [],
  currentRow = null,
}) => {
  const maxMult = TOWER_MAX_MULTIPLIERS[difficulty] ?? 1.5;

  if (gameOver) {
    return 0;
  }

  if (gameWon) {
    return maxMult;
  }

  const progress = getTowerProgress({ currentRow, rows, selectedBoxes });

  if (checkedOut || progress > 0) {
    return computeTowerProgressMultiplier(difficulty, progress, rows);
  }

  const stake = Number(betAmount);
  const payout = Number(profit);
  if (payout > 0 && stake > 0) {
    return payout / stake;
  }

  return 0;
};
