import { useCallback, useEffect, useState } from "react";
import apiService from "../../../config/api";
import {
  CRASH_FAIRNESS_FORMULA,
  hashServerSeed,
  verifyCrashRound,
} from "../../../utils/crashFairness";

const copyText = async (value) => {
  if (!value) return;
  await navigator.clipboard.writeText(String(value));
};

const CrashFairnessModal = ({ setIsFairness, prefill = null }) => {
  const revealed = prefill?.revealed || null;
  const [tab, setTab] = useState(revealed?.serverSeed ? "verify" : "seeds");
  const [clientSeed, setClientSeed] = useState(
    revealed?.clientSeed || prefill?.clientSeed || ""
  );
  const [serverSeed, setServerSeed] = useState(revealed?.serverSeed || "");
  const [serverSeedHash, setServerSeedHash] = useState(
    revealed?.serverSeedHash || prefill?.serverSeedHash || ""
  );
  const [nonce, setNonce] = useState(
    revealed?.nonce != null
      ? String(revealed.nonce)
      : prefill?.nonce != null
        ? String(prefill.nonce)
        : "0"
  );
  const [crashPoint, setCrashPoint] = useState(
    revealed?.crashPoint != null ? String(revealed.crashPoint) : ""
  );
  const [alt, setAlt] = useState(Boolean(revealed?.alt ?? prefill?.alt));
  const [verification, setVerification] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const next = prefill?.revealed || null;
    setClientSeed(next?.clientSeed || prefill?.clientSeed || "");
    setServerSeed(next?.serverSeed || "");
    setServerSeedHash(next?.serverSeedHash || prefill?.serverSeedHash || "");
    setNonce(
      next?.nonce != null
        ? String(next.nonce)
        : prefill?.nonce != null
          ? String(prefill.nonce)
          : "0"
    );
    setCrashPoint(next?.crashPoint != null ? String(next.crashPoint) : "");
    setAlt(Boolean(next?.alt ?? prefill?.alt));
    if (next?.serverSeed) setTab("verify");
  }, [prefill]);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    setVerifyError("");
    setVerification(null);
    try {
      const local = await verifyCrashRound({
        serverSeed,
        clientSeed,
        nonce,
        serverSeedHash,
        crashPoint,
        alt,
      });
      let remote = null;
      try {
        const response = await apiService.games.verifyFairness({
          gameKey: "crash",
          serverSeed,
          clientSeed,
          nonce,
          alt,
        });
        remote = response.data.verification;
      } catch {
        remote = null;
      }

      const computedHash = await hashServerSeed(serverSeed);
      setVerification({
        ...local,
        remote,
        hashMatch:
          serverSeedHash != null && serverSeedHash !== ""
            ? computedHash === serverSeedHash
            : local.hashMatch,
      });
    } catch (error) {
      setVerifyError(error?.message || "Unable to verify this crash round.");
    } finally {
      setVerifying(false);
    }
  }, [serverSeed, clientSeed, nonce, serverSeedHash, crashPoint, alt]);

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Provably Fair — Crash</h3>
        <button
          type="button"
          className="text-label"
          onClick={() => setIsFairness(false)}
        >
          Close
        </button>
      </div>

      <p className="mt-2 text-xs text-label">
        {revealed?.formula ||
          (prefill?.rtpPercent != null
            ? `99%, then 1–6 HMAC-picked 40/50/60/70/80/90 rounds, then 99% again. This round: ${prefill.rtpPercent}%.`
            : CRASH_FAIRNESS_FORMULA)}
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
          <p className="text-xs text-label">
            The next crash point is committed as a hash during betting. The raw
            server seed is revealed only after that round crashes — a new seed is
            used for the following round, so revealing one round cannot predict
            the next.
          </p>
          <FairnessField
            label="Current client seed"
            value={prefill?.clientSeed}
            onCopy={copyText}
          />
          <FairnessField
            label="Current server seed hash"
            value={prefill?.serverSeedHash}
            onCopy={copyText}
          />
          <FairnessField
            label="Current nonce"
            value={prefill?.nonce != null ? String(prefill.nonce) : "—"}
            onCopy={copyText}
          />
          <FairnessField
            label="This round RTP"
            value={
              prefill?.rtpPercent != null
                ? `${prefill.rtpPercent}%${
                    prefill.alt
                      ? prefill.streakLength != null
                        ? ` (HMAC pick ${prefill.streakIndex}/${prefill.streakLength})`
                        : " (HMAC pick)"
                      : ""
                  }`
                : "—"
            }
            onCopy={copyText}
          />
          {revealed?.serverSeed ? (
            <FairnessField
              label="Last revealed server seed"
              value={revealed.serverSeed}
              onCopy={copyText}
            />
          ) : (
            <p className="text-xs text-label">
              Wait for a round to crash to reveal its server seed, then verify.
            </p>
          )}
        </div>
      )}

      {tab === "verify" && (
        <div className="mt-4 space-y-3">
          <FairnessInput
            label="Client seed"
            value={clientSeed}
            onChange={setClientSeed}
          />
          <FairnessInput
            label="Server seed (revealed after crash)"
            value={serverSeed}
            onChange={setServerSeed}
          />
          <FairnessInput
            label="Server seed hash"
            value={serverSeedHash}
            onChange={setServerSeedHash}
          />
          <FairnessInput label="Nonce" value={nonce} onChange={setNonce} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={alt}
              onChange={(event) => setAlt(event.target.checked)}
            />
            <span className="text-label">
              Lower RTP round (HMAC pick from 40–90)
            </span>
          </label>
          <FairnessInput
            label="Crash point (optional check)"
            value={crashPoint}
            onChange={setCrashPoint}
          />

          <button
            type="button"
            className="w-full rounded bg-button-primary py-2 text-sm font-semibold text-black"
            disabled={verifying}
            onClick={handleVerify}
          >
            {verifying ? "Verifying…" : "Verify crash point"}
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
                <StatusTone value={verification.hashMatch} />
              </p>
              <p>
                Crash match:{" "}
                <StatusTone value={verification.crashMatch} />
              </p>
              <p className="font-mono text-xs text-label">
                RTP {verification.rtpPercent ?? 99}% · N={verification.n} → C=
                {verification.crashPoint}x
                {verification.remote?.result != null
                  ? ` (API ${verification.remote.result}x)`
                  : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusTone = ({ value }) => (
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

export default CrashFairnessModal;
