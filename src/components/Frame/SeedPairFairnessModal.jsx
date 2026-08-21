import { useCallback, useEffect, useState } from "react";
import apiService from "../../config/api";
import { hashServerSeed, resultsMatch } from "../../utils/originalsFairness";

const copyText = async (value) => {
  if (!value && value !== 0) return;
  await navigator.clipboard.writeText(String(value));
};

const SeedPairFairnessModal = ({
  setIsFairness,
  prefill = null,
  commitment = null,
  gameKey,
  title,
  formula,
  rotateMode = true,
  seedHint = "Rotate to reveal the previous server seed, then verify past rounds.",
  verifyLabel = "Verify result",
  formatResult,
}) => {
  const [tab, setTab] = useState(
    prefill?.serverSeed || prefill?.observed != null ? "verify" : "seeds"
  );
  const [loadingSeed, setLoadingSeed] = useState(rotateMode);
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
    if (!rotateMode) return;
    setLoadingSeed(true);
    try {
      const response = await apiService.games.getFairnessCurrentSeed(gameKey);
      setCurrentSeed(response.data.seed);
    } catch {
      setCurrentSeed(null);
    } finally {
      setLoadingSeed(false);
    }
  }, [gameKey, rotateMode]);

  useEffect(() => {
    loadSeed();
  }, [loadSeed]);

  useEffect(() => {
    if (!prefill) return;
    setClientSeed(prefill.clientSeed || "");
    setServerSeedHash(prefill.serverSeedHash || "");
    setServerSeed(prefill.serverSeed || "");
    setNonce(prefill.nonce != null ? String(prefill.nonce) : "0");
    if (prefill.serverSeed || prefill.observed != null) setTab("verify");
  }, [prefill]);

  const handleRotate = async () => {
    setRotating(true);
    try {
      const response = await apiService.games.rotateFairnessSeed(
        gameKey,
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

      const extra = {};
      if (prefill?.length != null) extra.length = Number(prefill.length);
      if (prefill?.segments != null && extra.length == null) {
        extra.length = Number(prefill.segments);
      }
      if (prefill?.risk) extra.risk = prefill.risk;
      if (prefill?.difficulty) extra.difficulty = prefill.difficulty;

      const response = await apiService.games.verifyFairness({
        gameKey,
        serverSeed,
        clientSeed,
        nonce,
        ...extra,
      });
      const computedHash = await hashServerSeed(serverSeed);
      const expectedHash = serverSeedHash || prefill?.serverSeedHash;
      const apiResult = response.data.verification?.result;
      const observed = prefill?.observed;

      setVerification({
        ...response.data.verification,
        hashMatch: expectedHash ? computedHash === expectedHash : null,
        roundMatch: resultsMatch(observed, apiResult),
      });
    } catch (error) {
      setVerifyError(
        error?.response?.data?.message || "Unable to verify this round."
      );
    } finally {
      setVerifying(false);
    }
  };

  const resultText = formatResult
    ? formatResult(verification, prefill)
    : verification?.result != null
      ? String(verification.result)
      : prefill?.observed != null
        ? String(prefill.observed)
        : "—";

  const commitmentView = rotateMode
    ? currentSeed
    : commitment || {
        clientSeed: prefill?.clientSeed,
        serverSeedHash: prefill?.serverSeedHash,
        nonce: prefill?.nonce,
      };

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          type="button"
          className="text-label"
          onClick={() => setIsFairness(false)}
        >
          Close
        </button>
      </div>

      <p className="mt-2 text-xs text-label">{formula}</p>

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
                value={commitmentView?.clientSeed}
                onCopy={copyText}
              />
              <FairnessField
                label="Server seed hash"
                value={commitmentView?.serverSeedHash}
                onCopy={copyText}
              />
              <FairnessField
                label={rotateMode ? "Next nonce" : "Nonce"}
                value={
                  commitmentView?.nonce != null
                    ? String(commitmentView.nonce)
                    : "—"
                }
                onCopy={copyText}
              />
            </>
          )}

          {revealedSeed?.serverSeed || prefill?.serverSeed ? (
            <FairnessField
              label={
                rotateMode
                  ? "Previous server seed (revealed)"
                  : "Server seed (revealed after the round)"
              }
              value={revealedSeed?.serverSeed || prefill?.serverSeed}
              onCopy={copyText}
            />
          ) : (
            <p className="text-xs text-label">{seedHint}</p>
          )}

          {rotateMode && (
            <>
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
            </>
          )}
        </div>
      )}

      {tab === "verify" && (
        <div className="mt-4 space-y-3">
          {prefill?.observed != null && (
            <p className="text-xs text-label">
              {prefill.observedLabel || "Last round"}:{" "}
              <span className="font-mono text-white">
                {prefill.observedDisplay || String(prefill.observed)}
              </span>
            </p>
          )}
          <FairnessInput
            label="Client seed"
            value={clientSeed}
            onChange={setClientSeed}
          />
          <FairnessInput
            label={
              rotateMode
                ? "Server seed (revealed after rotation)"
                : "Server seed (revealed after the round)"
            }
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
            {verifying ? "Verifying…" : verifyLabel}
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
                Last round match: <MatchLabel value={verification.roundMatch} />
              </p>
              <p className="font-mono text-xs text-label">{resultText}</p>
              {verification.normalizedRoll != null && (
                <p className="font-mono text-xs text-label">
                  u={Number(verification.normalizedRoll).toFixed(12)}
                </p>
              )}
              <p className="text-xs text-label">
                {verification.formula || formula}
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

export default SeedPairFairnessModal;
