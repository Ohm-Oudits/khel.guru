export const TWIST_GAME_KEY = "twist";

export const TWIST_OUTCOME_TABLE = [
  { outcome: "green", max: 0.25, chance: 0.25, label: "Gem 1 (inner)" },
  { outcome: "orange", max: 0.45, chance: 0.2, label: "Gem 2 (middle)" },
  { outcome: "purple", max: 0.6, chance: 0.15, label: "Gem 3 (outer)" },
  { outcome: "null", max: 0.75, chance: 0.15, label: "Neutral" },
  { outcome: "skull", max: 1, chance: 0.25, label: "Skull" },
];

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
  let buffer = await hmacBytesFromRound({
    serverSeed,
    clientSeed,
    nonce,
    round,
  });

  const nextByte = async () => {
    if (offset >= 32) {
      round += 1;
      offset = 0;
      buffer = await hmacBytesFromRound({
        serverSeed,
        clientSeed,
        nonce,
        round,
      });
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

export const deriveTwistOutcome = (float) => {
  const x = Number(float);
  const value = Number.isFinite(x) ? Math.min(Math.max(x, 0), 0.999999999999) : 0;
  const row =
    TWIST_OUTCOME_TABLE.find((entry) => value < entry.max) ||
    TWIST_OUTCOME_TABLE[TWIST_OUTCOME_TABLE.length - 1];
  return row.outcome;
};

export const verifyTwistSpin = async ({ serverSeed, clientSeed, nonce }) => {
  const [float] = await takeFairnessFloats({
    serverSeed,
    clientSeed,
    nonce,
    count: 1,
  });
  return {
    float,
    outcome: deriveTwistOutcome(float),
    serverSeedHash: await hashServerSeed(serverSeed),
    table: TWIST_OUTCOME_TABLE,
  };
};
