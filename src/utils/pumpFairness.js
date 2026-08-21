import { hashServerSeed, takeFairnessFloats } from "./twistFairness";
import {
  riskMultiplierFairnessFormula,
  rtpForMultiplierRisk,
} from "./originalsFairness";

export { hashServerSeed };

export const PUMP_FAIRNESS_FORMULA = riskMultiplierFairnessFormula("low");

export const derivePumpPopAt = (float, risk = "Low") => {
  if (!(Number(float) > 0)) return 1;
  const rtp = rtpForMultiplierRisk(risk);
  return Math.max(1, Math.floor((rtp / Number(float)) * 100) / 100);
};

export const verifyPumpPop = async ({
  serverSeed,
  clientSeed,
  nonce,
  risk = "Low",
}) => {
  const [float] = await takeFairnessFloats({
    serverSeed,
    clientSeed,
    nonce: Number.parseInt(nonce, 10),
    count: 1,
  });
  const popAt = derivePumpPopAt(float, risk);
  return {
    float,
    popAt,
    risk,
    rtp: rtpForMultiplierRisk(risk),
    formula: riskMultiplierFairnessFormula(risk),
    serverSeedHash: await hashServerSeed(serverSeed),
  };
};
