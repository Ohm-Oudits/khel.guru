import { hashServerSeed } from "./twistFairness";

export const CRASH_RTP = 0.99;
export const CRASH_ALT_RTP_PERCENTS = [40, 50, 60, 70, 80, 90];
export const CRASH_ALT_STREAK_MAX = 6;

export const crashAltStreakLength = (selector = 0) =>
  1 + (Number(selector) % CRASH_ALT_STREAK_MAX);

export const resolveCrashRtp = ({ alt = false, selector = 0 } = {}) => {
  if (!alt) {
    return {
      rtp: CRASH_RTP,
      rtpPercent: 99,
      alt: false,
      altIndex: null,
    };
  }
  const list = CRASH_ALT_RTP_PERCENTS;
  const altIndex = Number(selector) % list.length;
  const rtpPercent = list[altIndex];
  return {
    rtp: rtpPercent / 100,
    rtpPercent,
    alt: true,
    altIndex,
  };
};

export const crashFairnessFormula = (rtpPercent = 99) =>
  `A 99% round is followed by 1–6 HMAC-picked rounds from [0.40, 0.50, 0.60, 0.70, 0.80, 0.90], then 99% again. SHA256(serverSeed) is public while betting. After crash, serverSeed is revealed. HMAC first 8 hex digits → N. C = max(1, floor((2^32 / (N + 1)) × rtp × 100) / 100). This round rtp=${Number(rtpPercent)}%.`;

export const CRASH_FAIRNESS_FORMULA = crashFairnessFormula(99);

/** P(reach X) = rtp / X, as a percent. */
export const crashReachChancePercent = (targetMultiplier, rtp = CRASH_RTP) => {
  const target = Number(targetMultiplier);
  const edge = Number(rtp);
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(edge)) return 0;
  return (edge / target) * 100;
};

const bytesToHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const hmacSha256Bytes = async (serverSeed, message) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(serverSeed),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return new Uint8Array(signature);
};

export const hmacInteger32FromBytes = (bytes = []) =>
  (((bytes[0] || 0) << 24) |
    ((bytes[1] || 0) << 16) |
    ((bytes[2] || 0) << 8) |
    (bytes[3] || 0)) >>>
  0;

export const deriveStakeCrashPoint = (n, rtp = CRASH_RTP) => {
  const point = (2 ** 32 / (Number(n) + 1)) * rtp;
  return Math.max(1, Math.floor(point * 100) / 100);
};

export const deriveStakeCrashPointFromSeeds = async ({
  serverSeed,
  clientSeed,
  nonce = 0,
  alt = false,
}) => {
  const bytes = await hmacSha256Bytes(
    serverSeed,
    `${clientSeed}:${Number(nonce) || 0}:0`
  );
  const n = hmacInteger32FromBytes(bytes);
  const selector = hmacInteger32FromBytes(bytes.slice(4, 8));
  const resolved = resolveCrashRtp({ alt, selector });
  return {
    n,
    selector,
    ...resolved,
    digestPrefix: bytesToHex(bytes.slice(0, 4)),
    crashPoint: deriveStakeCrashPoint(n, resolved.rtp),
    formula: crashFairnessFormula(resolved.rtpPercent),
  };
};

export const verifyCrashRound = async ({
  serverSeed,
  clientSeed,
  nonce,
  serverSeedHash,
  crashPoint,
  alt = false,
} = {}) => {
  if (!serverSeed || !clientSeed) {
    throw new Error("Server seed and client seed are required.");
  }

  const hash = await hashServerSeed(serverSeed);
  const derived = await deriveStakeCrashPointFromSeeds({
    serverSeed,
    clientSeed,
    nonce,
    alt,
  });
  const expected = Number(crashPoint);

  return {
    hash,
    hashMatch: serverSeedHash ? hash === serverSeedHash : null,
    n: derived.n,
    rtp: derived.rtp,
    rtpPercent: derived.rtpPercent,
    alt: derived.alt,
    crashPoint: derived.crashPoint,
    crashMatch: Number.isFinite(expected)
      ? expected === derived.crashPoint
      : null,
    formula: derived.formula,
  };
};

export { hashServerSeed };
