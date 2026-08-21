export const DICE_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → float u in [0,1). Roll = floor(u × 10001) / 100 covering 0.00–100.00. SHA256(serverSeed) is public until you rotate the pair.";

export const LIMBO_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → float u in [0,1). Result = max(1, floor((0.99 / u) × 100) / 100) (99% RTP).";

export const MULTIPLIER_RISK_RTP = {
  low: 0.99,
  medium: 0.8,
  high: 0.5,
};

export const normalizeMultiplierRisk = (risk) => {
  const key = String(risk || "low").trim().toLowerCase();
  if (key === "medium" || key === "med") return "medium";
  if (key === "high") return "high";
  return "low";
};

export const rtpForMultiplierRisk = (risk) =>
  MULTIPLIER_RISK_RTP[normalizeMultiplierRisk(risk)];

export const riskMultiplierFairnessFormula = (risk = "low") => {
  const level = normalizeMultiplierRisk(risk);
  const rtp = MULTIPLIER_RISK_RTP[level];
  const rtpLabel = rtp.toFixed(2);
  return `HMAC_SHA256(serverSeed, clientSeed:nonce:round) → float u in [0,1). Result = max(1, floor((${rtpLabel} / u) × 100) / 100). Low=0.99/u, Medium=0.80/u, High=0.50/u. Higher risk crashes earlier. This round: ${level} (${rtpLabel}/u).`;
};

export const SLIDE_FAIRNESS_FORMULA =
  "Per round: SHA256(serverSeed) is public while betting. After the result, serverSeed is revealed. HMAC_SHA256(serverSeed, clientSeed:nonce:round) → float u. Result = max(1, floor((0.98 / u) × 100) / 100). Win if result ≥ player target X; payout = stake × X. P(win) = 0.98 / X. A new seed is committed for the next round.";

export const WHEEL_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → float u in [0,1). Index = floor(u × segments). Multiplier is the published risk table cell at that index. SHA256(serverSeed) is public until you rotate the pair.";

export const hashServerSeed = async (serverSeed) => {
  const encoded = new TextEncoder().encode(String(serverSeed));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const numbersMatch = (left, right) => {
  const a = Number(left);
  const b = Number(right);
  if (Number.isFinite(a) && Number.isFinite(b)) return a === b;
  if (left == null || right == null) return null;
  return String(left) === String(right);
};

export const resultsMatch = (left, right) => {
  if (Array.isArray(left) || Array.isArray(right)) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return numbersMatch(left, right);
};
