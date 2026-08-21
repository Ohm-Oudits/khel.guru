export const GRID_CELLS = 9;
export const MOBILE_BAR_ICONS = 9;

export const slotsData = [
  { multiplier: "100.00×", chance: "0.5%" },
  { multiplier: "10.00×", chance: "1.0%" },
  { multiplier: "7.00×", chance: "5.0%" },
  { multiplier: "5.00×", chance: "10.0%" },
  { multiplier: "3.50×", chance: "15.0%" },
  { multiplier: "2.35×", chance: "20.0%" },
  { multiplier: "1.45×", chance: "35.0%" },
  { multiplier: "0.85×", chance: "35.0%" },
  { multiplier: "0.45×", chance: "45.0%" },
  { multiplier: "0.15×", chance: "35.0%" },
  { multiplier: "0.00×", chance: "35.0%" },
  { multiplier: "0.00×", chance: "35.0%" },
];

/** diamonds + different + free = 9 grid cells */
export const displaySlots = [
  { diamonds: 8, different: 0, free: 1 },
  { diamonds: 7, different: 0, free: 2 },
  { diamonds: 6, different: 0, free: 3 },
  { diamonds: 5, different: 4, free: 0 },
  { diamonds: 5, different: 3, free: 1 },
  { diamonds: 4, different: 4, free: 1 },
  { diamonds: 4, different: 3, free: 2 },
  { diamonds: 4, different: 2, free: 3 },
  { diamonds: 3, different: 3, free: 3 },
  { diamonds: 3, different: 2, free: 4 },
  { diamonds: 2, different: 2, free: 5 },
  { diamonds: 2, different: 0, free: 7 },
];

export const backendMultipliers = [
  100.0, 10.0, 7.0, 5.0, 3.5, 2.35, 1.45, 0.85, 0.45, 0.15, 0.0, 0.0,
];

export const normalizeDiamondCounts = (diamondCounts) => {
  if (!diamondCounts) return {};

  if (diamondCounts instanceof Map) {
    return Object.fromEntries(diamondCounts);
  }

  if (typeof diamondCounts === "object") {
    const normalized = {};
    for (const [color, data] of Object.entries(diamondCounts)) {
      if (data && typeof data === "object") {
        normalized[color] = {
          count: Number(data.count) || 0,
          indices: Array.isArray(data.indices) ? data.indices : [],
        };
      }
    }
    return normalized;
  }

  return {};
};

export const computeHighestCounts = (diamondCounts) => {
  const counts = normalizeDiamondCounts(diamondCounts);
  const highest = {
    main: { color: "", count: 0 },
    second: { color: "", count: 0 },
  };

  Object.entries(counts).forEach(([color, data]) => {
    const count = Number(data?.count) || 0;
    if (count <= 0) return;

    if (count > highest.main.count) {
      if (highest.main.count > highest.second.count) {
        highest.second.color = highest.main.color;
        highest.second.count = highest.main.count;
      }
      highest.main.color = color;
      highest.main.count = count;
    } else if (count > highest.second.count && color !== highest.main.color) {
      highest.second.color = color;
      highest.second.count = count;
    }
  });

  return highest;
};

/** Match payout row: grid free cells = 9 - main - second (same as backend) */
export const findMatchingSlotIndex = (main, second) => {
  if (main <= 0) return null;

  const gridFree = GRID_CELLS - main - second;
  const idx = displaySlots.findIndex(
    (slot) =>
      slot.diamonds === main &&
      slot.different === second &&
      slot.free === gridFree
  );

  return idx >= 0 ? idx : null;
};

export const findMatchingSlotIndexFromCounts = (diamondCounts) => {
  const counts = normalizeDiamondCounts(diamondCounts);
  const ranked = Object.entries(counts)
    .map(([color, data]) => ({ color, count: Number(data?.count) || 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.color.localeCompare(b.color));

  const mainCount = ranked[0]?.count || 0;
  const secondCount = ranked[1]?.count || 0;
  return findMatchingSlotIndex(mainCount, secondCount);
};

/** Mobile bar shows all 9 grid cells as icons */
export const getMobileBarCounts = (main, second, matchedIndex) => {
  if (main <= 0) {
    return { diamonds: 0, different: 0, free: MOBILE_BAR_ICONS, idle: true };
  }

  let diamonds = main;
  let different = second;

  if (matchedIndex !== null && displaySlots[matchedIndex]) {
    const slot = displaySlots[matchedIndex];
    diamonds = slot.diamonds;
    different = slot.different;
  }

  if (diamonds + different > MOBILE_BAR_ICONS) {
    different = Math.max(0, MOBILE_BAR_ICONS - diamonds);
  }

  const free = Math.max(0, MOBILE_BAR_ICONS - diamonds - different);

  return { diamonds, different, free, idle: false };
};

export const getMultiplierForCounts = (main, second) => {
  const idx = findMatchingSlotIndex(main, second);
  if (idx === null) return "0.00×";
  return slotsData[idx]?.multiplier || "0.00×";
};

export const getNumericMultiplierFromDiamondCounts = (diamondCounts) => {
  const idx = findMatchingSlotIndexFromCounts(diamondCounts);
  if (idx === null) return 0;
  return backendMultipliers[idx] ?? 0;
};
