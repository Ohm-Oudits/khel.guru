export const TOWER_ROWS = 9;

export const TOWER_LEVEL_MAP = {
  easy: { count: 3, size: 4, multiplier: 1.5 },
  medium: { count: 2, size: 3, multiplier: 2 },
  hard: { count: 1, size: 2, multiplier: 3 },
  extreme: { count: 1, size: 3, multiplier: 4 },
  nightmare: { count: 1, size: 4, multiplier: 5 },
};

const DIFFICULTY_ALIASES = {
  easy: "easy",
  Easy: "easy",
  medium: "medium",
  Medium: "medium",
  hard: "hard",
  Hard: "hard",
  extreme: "extreme",
  Extreme: "extreme",
  expert: "extreme",
  Expert: "extreme",
  nightmare: "nightmare",
  Nightmare: "nightmare",
  master: "nightmare",
  Master: "nightmare",
};

export const normalizeTowerDifficulty = (difficulty) =>
  DIFFICULTY_ALIASES[difficulty] || "easy";

export const getTowerLevelConfig = (difficulty) =>
  TOWER_LEVEL_MAP[normalizeTowerDifficulty(difficulty)] || TOWER_LEVEL_MAP.easy;

export const floatsNeededForTower = (difficulty) =>
  TOWER_ROWS * getTowerLevelConfig(difficulty).count;

const hexToBytes = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const hashServerSeed = async (serverSeed) => {
  const encoded = new TextEncoder().encode(serverSeed);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
};

const hmacBytesFromRound = async ({ serverSeed, clientSeed, nonce, round }) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(serverSeed),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const message = new TextEncoder().encode(`${clientSeed}:${nonce}:${round}`);
  const signature = await crypto.subtle.sign("HMAC", key, message);
  return new Uint8Array(signature);
};

export const bytesToFloat = (bytes) =>
  bytes.reduce((sum, value, index) => sum + value / 256 ** (index + 1), 0);

export const takeFairnessFloats = async ({
  serverSeed,
  clientSeed,
  nonce,
  count,
  cursor = 0,
}) => {
  const floats = [];
  let round = Math.floor(cursor / 32);
  let offset = cursor - round * 32;
  let buffer = await hmacBytesFromRound({ serverSeed, clientSeed, nonce, round });

  const nextByte = async () => {
    if (offset >= 32) {
      round += 1;
      offset = 0;
      buffer = await hmacBytesFromRound({ serverSeed, clientSeed, nonce, round });
    }
    const value = buffer[offset];
    offset += 1;
    return value;
  };

  for (let i = 0; i < count; i += 1) {
    floats.push(
      bytesToFloat([
        await nextByte(),
        await nextByte(),
        await nextByte(),
        await nextByte(),
      ])
    );
  }

  return floats;
};

export const pickEggColumnsForLevel = (floats, size, eggCount) => {
  const tiles = Array.from({ length: size }, (_, index) => index);
  for (let i = 0; i < eggCount; i += 1) {
    const remaining = size - i;
    const j = i + Math.floor((floats[i] || 0) * remaining);
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles.slice(0, eggCount).sort((a, b) => a - b);
};

export const deriveTowerGridFromFloats = (floats, difficulty) => {
  const key = normalizeTowerDifficulty(difficulty);
  const { count: eggCount, size } = getTowerLevelConfig(key);
  let offset = 0;

  const grid = Array.from({ length: TOWER_ROWS }, () =>
    Array.from({ length: size }, () => ({
      revealed: false,
      isCorrect: false,
    }))
  );

  const eggLevels = [];

  for (let level = 0; level < TOWER_ROWS; level += 1) {
    const levelFloats = floats.slice(offset, offset + eggCount);
    offset += eggCount;
    const eggColumns = pickEggColumnsForLevel(levelFloats, size, eggCount);
    eggLevels.push(eggColumns);
    eggColumns.forEach((col) => {
      grid[level][col].isCorrect = true;
    });
  }

  return {
    grid,
    cols: size,
    rows: TOWER_ROWS,
    eggCount,
    difficulty: key,
    eggLevels,
  };
};

export const verifyTowerLayout = async ({
  serverSeed,
  clientSeed,
  nonce,
  difficulty,
}) => {
  const floatCount = floatsNeededForTower(difficulty);
  const floats = await takeFairnessFloats({
    serverSeed,
    clientSeed,
    nonce,
    count: floatCount,
  });
  const layout = deriveTowerGridFromFloats(floats, difficulty);
  return {
    ...layout,
    floatCount,
    serverSeedHash: await hashServerSeed(serverSeed),
    maxMultiplier: getTowerLevelConfig(difficulty).multiplier,
  };
};

export const gridMatchesEggLevels = (grid, eggLevels) => {
  if (!Array.isArray(grid) || !Array.isArray(eggLevels)) {
    return false;
  }

  return eggLevels.every((columns, rowIndex) =>
    columns.every((col) => Boolean(grid[rowIndex]?.[col]?.isCorrect))
  );
};

export const validateSelectedBoxesAgainstGrid = (selectedBoxes = [], grid) => {
  if (!Array.isArray(grid) || !Array.isArray(selectedBoxes)) {
    return { valid: false, mismatches: [] };
  }

  const mismatches = selectedBoxes
    .map((box) => {
      const cell = grid[box.row]?.[box.col];
      const expectedCorrect = Boolean(cell?.isCorrect);
      const actualCorrect = Boolean(box.correct ?? box.isCorrect);
      if (expectedCorrect === actualCorrect) {
        return null;
      }
      return { row: box.row, col: box.col, expectedCorrect, actualCorrect };
    })
    .filter(Boolean);

  return {
    valid: mismatches.length === 0,
    mismatches,
  };
};
