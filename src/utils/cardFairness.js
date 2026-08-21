import { hashServerSeed, takeFairnessFloats } from "./twistFairness";

export const CARD_SUITS = ["♦", "♥", "♠", "♣"];
export const CARD_RANKS = [
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
  "A",
];

export const STAKE_CARDS = CARD_RANKS.flatMap((rank) =>
  CARD_SUITS.map((suit) => ({
    rank,
    suit,
    value: rank,
    label: `${suit}${rank}`,
  }))
);

export const HILO_BLACKJACK_EVENT_COUNT = 52;
export const BACCARAT_EVENT_COUNT = 6;

export const CARD_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → float → CARDS[floor(float × 52)] (unlimited decks)";

export const cardIndexFromFloat = (float) => {
  const x = Number(float);
  const value = Number.isFinite(x) ? Math.min(Math.max(x, 0), 0.999999999999) : 0;
  return Math.min(51, Math.floor(value * 52));
};

export const cardFromFloat = (float) => {
  const index = cardIndexFromFloat(float);
  return { ...STAKE_CARDS[index], index };
};

export const verifyCardShoe = async ({
  serverSeed,
  clientSeed,
  nonce,
  count,
}) => {
  const floats = await takeFairnessFloats({
    serverSeed,
    clientSeed,
    nonce,
    count,
  });
  const cards = floats.map(cardFromFloat);
  return {
    cards,
    labels: cards.map((card) => card.label),
    formula: CARD_FAIRNESS_FORMULA,
    serverSeedHash: await hashServerSeed(serverSeed),
  };
};

export const dealtMatchesShoe = (labels = [], dealt = []) => {
  if (!Array.isArray(dealt) || dealt.length === 0) return null;
  return dealt.every((item) => {
    const index = item?.index;
    const label = item?.label ?? item;
    if (index == null || index < 0) return false;
    return labels[index] === label;
  });
};

export { hashServerSeed };
