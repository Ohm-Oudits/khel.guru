import { useCallback, useEffect, useState } from "react";
import apiService from "../../../config/api";
import {
  ROULETTE_FAIRNESS_FORMULA,
  hashServerSeed,
  verifyRoulettePocket,
} from "../../../utils/rouletteFairness";

const copyText = async (value) => {
  if (!value && value !== 0) return;
  await navigator.clipboard.writeText(String(value));
};

const RouletteFairnessModal = ({ setIsFairness, prefill = null }) => {
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
      const response = await apiService.games.getFairnessCurrentSeed("roulette");
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
        "roulette",
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
        gameKey: "roulette",
        serverSeed,
        clientSeed,
        nonce,
      });
      const computedHash = await hashServerSeed(serverSeed);
      const expectedHash = serverSeedHash || prefill?.serverSeedHash;
      const local = await verifyRoulettePocket({
        serverSeed,
        clientSeed,
        nonce,
      });
      const apiPocket = response.data.verification?.result;
      const observed =
        prefill?.pocket != null ? Number(prefill.pocket) : null;

      setVerification({
        ...response.data.verification,
        local,
        hashMatch: expectedHash ? computedHash === expectedHash : null,
        pocketMatch:
          apiPocket != null && local.pocket != null
            ? Number(apiPocket) === Number(local.pocket)
            : null,
        spinMatch:
          observed != null && local.pocket != null
            ? Number(observed) === Number(local.pocket)
            : null,
      });
    } catch (error) {
      setVerifyError(
        error?.response?.data?.message || "Unable to verify this roulette spin."
      );
    } finally {
      setVerifying(false);
    }
  };

  const pocket =
    verification?.result ??
    verification?.pocket ??
    verification?.local?.pocket;

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Provably Fair — Roulette</h3>
        <button
          type="button"
          className="text-label"
          onClick={() => setIsFairness(false)}
        >
          Close
        </button>
      </div>

      <p className="mt-2 text-xs text-label">{ROULETTE_FAIRNESS_FORMULA}</p>

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
              spins.
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
          {prefill?.pocket != null && (
            <p className="text-xs text-label">
              Last spin pocket:{" "}
              <span className="font-mono text-white">{prefill.pocket}</span>
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
            {verifying ? "Verifying…" : "Verify pocket"}
          </button>

          {verifyError && (
            <p className="rounded bg-red-500/15 p-2 text-sm text-red-300">
              {verifyError}
            </p>
          )}

          {verification && (
            <div className="space-y-2 rounded-lg border border-gray-700 bg-primary-1 p-3 text-sm">
              <p>
                Hash match:{" "}
                <MatchLabel value={verification.hashMatch} />
              </p>
              <p>
                Replay match:{" "}
                <MatchLabel value={verification.pocketMatch} />
              </p>
              <p>
                Last spin match:{" "}
                <MatchLabel value={verification.spinMatch} />
              </p>
              <p className="font-mono text-xs text-label">
                Pocket {pocket != null ? pocket : "—"}
                {verification.local?.float != null
                  ? ` · u=${Number(verification.local.float).toFixed(12)}`
                  : ""}
              </p>
              <p className="text-xs text-label">
                {verification.formula || ROULETTE_FAIRNESS_FORMULA}
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

export default RouletteFairnessModal;
