export const CARD_SUITS = ["♦", "♥", "♠", "♣", "↑", "↓"];
export const CARD_VALUES = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

const PLAYING_SUITS = [
  { suit: "♦", color: true },
  { suit: "♥", color: true },
  { suit: "♠", color: false },
  { suit: "♣", color: false },
];

export const randomPreviewCard = () => {
  const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
  const { suit, color } =
    PLAYING_SUITS[Math.floor(Math.random() * PLAYING_SUITS.length)];
  return { value, suit, color };
};

const HILO_RTP = 0.99;

const formatChance = (chance) => Number((chance * 100).toFixed(2));
const formatMultiplier = (chance) => Number((HILO_RTP / chance).toFixed(4));

export const getHiloOdds = (value) => {
  const index = CARD_VALUES.indexOf(value);
  if (index < 0) {
    return {
      high: { percent: 0, multiplier: 1 },
      low: { percent: 0, multiplier: 1 },
    };
  }
  const rank = index + 1;
  const ranks = CARD_VALUES.length;
  return {
    high: {
      percent: formatChance((14 - rank) / ranks),
      multiplier: formatMultiplier((14 - rank) / ranks),
    },
    low: {
      percent: formatChance(rank / ranks),
      multiplier: formatMultiplier(rank / ranks),
    },
  };
};
