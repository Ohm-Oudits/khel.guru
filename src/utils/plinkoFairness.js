import { hashServerSeed, takeFairnessFloats } from "./twistFairness";

export const PLINKO_FAIRNESS_FORMULA =
  "HMAC_SHA256(serverSeed, clientSeed:nonce:round) → n floats. Bounce i is Right if float_i ≥ 0.5 else Left. Slot k = count of Rights. P(k)=C(n,k)/2^n. Payout tables satisfy Σ P(k)M(k) ≈ 0.99.";

export const verifyPlinkoPath = async ({
  serverSeed,
  clientSeed,
  nonce,
  rows,
}) => {
  const count = Number(rows);
  const floats = await takeFairnessFloats({
    serverSeed,
    clientSeed,
    nonce: Number.parseInt(nonce, 10),
    count,
  });
  const path = floats.map((value) => (value >= 0.5 ? 1 : 0));
  const bin = path.reduce((sum, step) => sum + step, 0);
  return { path, bin };
};

export { hashServerSeed };
