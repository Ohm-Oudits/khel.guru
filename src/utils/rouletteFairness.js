import { hashServerSeed, takeFairnessFloats } from "./twistFairness";

export { hashServerSeed };

export const ROULETTE_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → float u in [0,1). Pocket = floor(u × 37) → European 0–36 (uniform 1/37). SHA256(serverSeed) is public until you rotate the pair.";

export const deriveRoulettePocket = (float) =>
  Math.min(36, Math.floor((Number(float) || 0) * 37));

export const fairnessFromBetResult = (result) => {
  if (!result) return null;
  const pf = result.provablyFair || {};
  const clientSeed = pf.clientSeed || result.clientSeed;
  const serverSeedHash = pf.serverSeedHash || result.serverSeedHash;
  const nonce = pf.nonce ?? result.nonce;
  if (clientSeed == null && !serverSeedHash && nonce == null) {
    return null;
  }
  const pocket = Number.parseInt(result.result, 10);
  return {
    gameKey: "roulette",
    clientSeed: clientSeed || "",
    serverSeedHash: serverSeedHash || "",
    nonce,
    cursor: pf.cursor ?? 0,
    pocket: Number.isNaN(pocket) ? null : pocket,
    formula: pf.formula || ROULETTE_FAIRNESS_FORMULA,
  };
};

export const verifyRoulettePocket = async ({
  serverSeed,
  clientSeed,
  nonce,
  cursor = 0,
}) => {
  const floats = await takeFairnessFloats({
    serverSeed,
    clientSeed,
    nonce: Number.parseInt(nonce, 10),
    count: 1,
    cursor: Number.parseInt(cursor, 10) || 0,
  });
  const pocket = deriveRoulettePocket(floats[0]);
  return {
    pocket,
    float: floats[0],
    formula: ROULETTE_FAIRNESS_FORMULA,
    serverSeedHash: await hashServerSeed(serverSeed),
  };
};
