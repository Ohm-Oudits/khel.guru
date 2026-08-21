import { hashServerSeed, takeFairnessFloats } from "./twistFairness";

export { hashServerSeed };

export const KENO_EVENT_COUNT = 10;
export const KENO_SQUARES = Array.from({ length: 40 }, (_, i) => i + 1);
export const KENO_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → 10 floats → Fisher-Yates on [1..40]: hit = pool[floor(float × remaining)]";

export const drawKenoHitsFromFloats = (floats = []) => {
  const pool = KENO_SQUARES.slice();
  const hits = [];
  const count = Math.min(KENO_EVENT_COUNT, floats.length);
  for (let i = 0; i < count; i += 1) {
    const remaining = pool.length;
    const index = Math.min(
      remaining - 1,
      Math.floor((Number(floats[i]) || 0) * remaining)
    );
    hits.push(pool[index]);
    pool.splice(index, 1);
  }
  return hits;
};

export const verifyKenoHits = async ({ serverSeed, clientSeed, nonce }) => {
  const floats = await takeFairnessFloats({
    serverSeed,
    clientSeed,
    nonce,
    count: KENO_EVENT_COUNT,
  });
  return {
    hits: drawKenoHitsFromFloats(floats),
    formula: KENO_FAIRNESS_FORMULA,
    serverSeedHash: await hashServerSeed(serverSeed),
  };
};
