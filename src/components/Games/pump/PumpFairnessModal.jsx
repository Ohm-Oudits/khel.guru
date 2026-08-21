import { useCallback, useEffect, useState } from "react";
import apiService from "../../../config/api";
import {
  PUMP_FAIRNESS_FORMULA,
  hashServerSeed,
  verifyPumpPop,
} from "../../../utils/pumpFairness";
import { riskMultiplierFairnessFormula } from "../../../utils/originalsFairness";

const copyText = async (value) => {
  if (!value && value !== 0) return;
  await navigator.clipboard.writeText(String(value));
};

const PumpFairnessModal = ({ setIsFairness, prefill = null }) => {
  const [tab, setTab] = useState(prefill ? "verify" : "seeds");
  const [loadingSeed, setLoadingSeed] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [currentSeed, setCurrentSeed] = useState(null);
  const [revealedSeed, setRevealedSeed] = useState(null);
  const [nextClientSeed, setNextClientSeed] = useState("");
  const [clientSeed, setClientSeed] = useState(prefill?.clientSeed || "");
  const [serverSeed, setServerSeed] = useState(prefill?.serverSeed || "");
  const [serverSeedHash, setServerSeedHash] = useState(
    prefill?.serverSeedHash || ""
  );
  const [nonce, setNonce] = useState(
    prefill?.nonce != null ? String(prefill.nonce) : "0"
  );
  const [verification, setVerification] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  const loadSeed = useCallback(async () => {
    setLoadingSeed(true);
    try {
      const response = await apiService.games.getFairnessCurrentSeed("pump");
      setCurrentSeed(response.data.seed);
    } catch {
      setCurrentSeed(null);
    } finally {
      setLoadingSeed(false);
    }
  }, []);

  useEffect(() => {
    loadSeed();
  }, [loadSeed]);

  useEffect(() => {
    if (!prefill) return;
    setClientSeed(prefill.clientSeed || "");
    setServerSeedHash(prefill.serverSeedHash || "");
    setServerSeed(prefill.serverSeed || "");
    setNonce(prefill.nonce != null ? String(prefill.nonce) : "0");
    setTab("verify");
  }, [prefill]);

  const handleRotate = async () => {
    setRotating(true);
    try {
      const response = await apiService.games.rotateFairnessSeed(
        "pump",
        nextClientSeed ? { clientSeed: nextClientSeed } : {}
      );
      setRevealedSeed(response.data.previousSeed);
      setCurrentSeed(response.data.nextSeed);
      setNextClientSeed("");
      if (response.data.previousSeed?.serverSeed) {
        setServerSeed(response.data.previousSeed.serverSeed);
      }
    } catch {
      setRevealedSeed(null);
    } finally {
      setRotating(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError("");
    setVerification(null);
    try {
      if (!serverSeed || !clientSeed) {
        setVerifyError("Server seed and client seed are required.");
        return;
      }

      const response = await apiService.games.verifyFairness({
        gameKey: "pump",
        serverSeed,
        clientSeed,
        nonce,
        risk: prefill?.risk || "Low",
      });
      const computedHash = await hashServerSeed(serverSeed);
      const expectedHash = serverSeedHash || prefill?.serverSeedHash;
      const local = await verifyPumpPop({
        serverSeed,
        clientSeed,
        nonce,
        risk: prefill?.risk || "Low",
      });
      const apiPop = Number(response.data.verification?.result);
      const observed =
        prefill?.popAt != null ? Number(prefill.popAt) : null;

      setVerification({
        ...response.data.verification,
        local,
        hashMatch: expectedHash ? computedHash === expectedHash : null,
        replayMatch:
          Number.isFinite(apiPop) && Number.isFinite(local.popAt)
            ? apiPop === local.popAt
            : null,
        roundMatch:
          Number.isFinite(observed) && Number.isFinite(local.popAt)
            ? observed === local.popAt
            : null,
      });
    } catch (error) {
      setVerifyError(
        error?.response?.data?.message || "Unable to verify this pump round."
      );
    } finally {
      setVerifying(false);
    }
  };

  const popAt =
    verification?.result ??
    verification?.local?.popAt ??
    prefill?.popAt;

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Provably Fair — Pump</h3>
        <button
          type="button"
          className="text-label"
          onClick={() => setIsFairness(false)}
        >
          Close
        </button>
      </div>

      <p className="mt-2 text-xs text-label">
        {riskMultiplierFairnessFormula(prefill?.risk || "Low")}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-primary-1 p-1">
        {["seeds", "verify"].map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-full py-2 text-sm font-semibold capitalize ${
              tab === value ? "bg-button-primary text-black" : "text-label"
            }`}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>

      {tab === "seeds" && (
        <div className="mt-4 space-y-3">
          {loadingSeed ? (
            <p className="text-sm text-label">Loading seed pair…</p>
          ) : (
            <>
              <FairnessField
                label="Client seed"
                value={currentSeed?.clientSeed}
                onCopy={copyText}
              />
              <FairnessField
                label="Server seed hash"
                value={currentSeed?.serverSeedHash}
                onCopy={copyText}
              />
              <FairnessField
                label="Next nonce"
                value={
                  currentSeed?.nonce != null ? String(currentSeed.nonce) : "—"
                }
                onCopy={copyText}
              />
            </>
          )}

          {revealedSeed?.serverSeed ? (
            <FairnessField
              label="Previous server seed (revealed)"
              value={revealedSeed.serverSeed}
              onCopy={copyText}
            />
          ) : (
            <p className="text-xs text-label">
              Rotate to reveal the previous server seed, then verify past
              rounds. The pop point is only shown after the balloon pops or you
              cash out.
            </p>
          )}

          <label className="block">
            <span className="text-xs font-semibold uppercase text-label">
              Next client seed (optional)
            </span>
            <input
              className="mt-1 w-full rounded border border-input bg-input p-2 text-sm"
              value={nextClientSeed}
              onChange={(event) => setNextClientSeed(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="w-full rounded bg-button-primary py-2 text-sm font-semibold text-black"
            disabled={rotating}
            onClick={handleRotate}
          >
            {rotating ? "Rotating…" : "Rotate seed pair"}
          </button>
        </div>
      )}

      {tab === "verify" && (
        <div className="mt-4 space-y-3">
          {prefill?.popAt != null && (
            <p className="text-xs text-label">
              Last round pop point:{" "}
              <span className="font-mono text-white">
                {Number(prefill.popAt).toFixed(2)}x
              </span>
              {prefill?.risk ? ` · ${prefill.risk}` : ""}
            </p>
          )}
          <FairnessInput
            label="Client seed"
            value={clientSeed}
            onChange={setClientSeed}
          />
          <FairnessInput
            label="Server seed (revealed after rotation)"
            value={serverSeed}
            onChange={setServerSeed}
          />
          <FairnessInput
            label="Server seed hash"
            value={serverSeedHash}
            onChange={setServerSeedHash}
          />
          <FairnessInput label="Nonce" value={nonce} onChange={setNonce} />

          <button
            type="button"
            className="w-full rounded bg-button-primary py-2 text-sm font-semibold text-black"
            disabled={verifying}
            onClick={handleVerify}
          >
            {verifying ? "Verifying…" : "Verify pop point"}
          </button>

          {verifyError && (
            <p className="rounded bg-red-500/15 p-2 text-sm text-red-300">
              {verifyError}
            </p>
          )}

          {verification && (
            <div className="space-y-2 rounded-lg border border-gray-700 bg-primary-1 p-3 text-sm">
              <p>
                Hash match: <MatchLabel value={verification.hashMatch} />
              </p>
              <p>
                Replay match: <MatchLabel value={verification.replayMatch} />
              </p>
              <p>
                Last round match: <MatchLabel value={verification.roundMatch} />
              </p>
              <p className="font-mono text-xs text-label">
                Pop {popAt != null ? `${Number(popAt).toFixed(2)}x` : "—"}
                {verification.local?.float != null
                  ? ` · u=${Number(verification.local.float).toFixed(12)}`
                  : ""}
              </p>
              <p className="text-xs text-label">
                {verification.formula || PUMP_FAIRNESS_FORMULA}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MatchLabel = ({ value }) => (
  <span
    className={
      value === true
        ? "text-green-300"
        : value === false
          ? "text-red-300"
          : "text-label"
    }
  >
    {value === true ? "confirmed" : value === false ? "mismatch" : "not checked"}
  </span>
);

const FairnessField = ({ label, value, onCopy }) => (
  <div className="rounded-lg bg-primary-1 p-3">
    <p className="text-xs font-semibold uppercase text-label">{label}</p>
    <p className="mt-1 break-all font-mono text-xs">{value || "—"}</p>
    {value ? (
      <button
        type="button"
        className="mt-2 text-xs text-button-primary"
        onClick={() => onCopy(value)}
      >
        Copy
      </button>
    ) : null}
  </div>
);

const FairnessInput = ({ label, value, onChange }) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase text-label">{label}</span>
    <input
      className="mt-1 w-full rounded border border-input bg-input p-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export default PumpFairnessModal;
