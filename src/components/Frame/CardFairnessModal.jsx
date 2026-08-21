import { useCallback, useEffect, useState } from "react";
import apiService from "../../config/api";
import {
  BACCARAT_EVENT_COUNT,
  HILO_BLACKJACK_EVENT_COUNT,
  hashServerSeed,
  verifyCardShoe,
} from "../../utils/cardFairness";

const EVENT_COUNTS = {
  hilo: HILO_BLACKJACK_EVENT_COUNT,
  blackjack: HILO_BLACKJACK_EVENT_COUNT,
  baccarat: BACCARAT_EVENT_COUNT,
};

const copyText = async (value) => {
  if (!value) return;
  await navigator.clipboard.writeText(String(value));
};

const CardFairnessModal = ({
  setIsFairness,
  gameKey = "hilo",
  prefill = null,
}) => {
  const eventCount = EVENT_COUNTS[gameKey] || HILO_BLACKJACK_EVENT_COUNT;
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
      const response = await apiService.games.getFairnessCurrentSeed(gameKey);
      setCurrentSeed(response.data.seed);
    } catch {
      setCurrentSeed(null);
    } finally {
      setLoadingSeed(false);
    }
  }, [gameKey]);

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

      const response = await apiService.games.verifyFairness({
        gameKey,
        serverSeed,
        clientSeed,
        nonce,
      });
      const computedHash = await hashServerSeed(serverSeed);
      const expectedHash = serverSeedHash || prefill?.serverSeedHash;
      const local = await verifyCardShoe({
        serverSeed,
        clientSeed,
        nonce: Number.parseInt(nonce, 10),
        count: eventCount,
      });

      setVerification({
        ...response.data.verification,
        hashMatch: expectedHash ? computedHash === expectedHash : null,
        local,
      });
    } catch (error) {
      setVerifyError(
        error?.response?.data?.message || "Unable to verify this card shoe."
      );
    } finally {
      setVerifying(false);
    }
  };

  const title =
    gameKey === "blackjack"
      ? "Blackjack"
      : gameKey === "baccarat"
        ? "Baccarat"
        : "Hilo";

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Provably Fair — {title}</h3>
        <button
          type="button"
          className="text-label"
          onClick={() => setIsFairness(false)}
        >
          Close
        </button>
      </div>

      <p className="mt-2 text-xs text-label">
        Unlimited decks: each card is CARDS[floor(float × 52)] from HMAC_SHA256
        (serverSeed, clientSeed:nonce:round). {title} generates {eventCount}{" "}
        game events per round.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-primary-1 p-1">
        {["seeds", "verify"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full py-2 text-sm font-semibold capitalize ${
              tab === value ? "bg-primary-3 text-white" : "text-label"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {tab === "seeds" && (
        <div className="mt-4 space-y-3">
          {loadingSeed ? (
            <p className="text-sm text-label">Loading active seed…</p>
          ) : (
            <>
              <FairnessField
                label="Active client seed"
                value={currentSeed?.clientSeed}
                onCopy={copyText}
              />
              <FairnessField
                label="Active server seed hash"
                value={currentSeed?.serverSeedHash}
                onCopy={copyText}
              />
              <FairnessField
                label="Next nonce"
                value={currentSeed?.nonce}
                onCopy={copyText}
              />
            </>
          )}

          {gameKey !== "baccarat" && (
            <div className="rounded-lg bg-primary-1 p-3">
              <p className="text-sm font-semibold">Rotate seed pair</p>
              <p className="mt-1 text-xs text-label">
                Rotation reveals the previous server seed so you can verify past
                rounds.
              </p>
              <label className="mt-3 block text-xs font-semibold uppercase text-label">
                Next client seed
              </label>
              <input
                className="mt-1 w-full rounded border border-input bg-input p-2 text-sm"
                value={nextClientSeed}
                onChange={(event) => setNextClientSeed(event.target.value)}
              />
              <button
                type="button"
                className="mt-3 w-full rounded bg-button-primary py-2 text-sm font-semibold text-black"
                disabled={rotating}
                onClick={handleRotate}
              >
                {rotating ? "Rotating…" : "Rotate seed pair"}
              </button>
            </div>
          )}

          {revealedSeed?.serverSeed && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm">
              <p className="font-semibold text-green-300">
                Previous server seed revealed
              </p>
              <p className="mt-2 break-all font-mono text-xs">
                {revealedSeed.serverSeed}
              </p>
            </div>
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
            label="Server seed (revealed after rotation / round end)"
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
            {verifying ? "Verifying…" : `Verify ${eventCount}-card stream`}
          </button>

          {verifyError && (
            <p className="rounded bg-red-500/15 p-2 text-sm text-red-300">
              {verifyError}
            </p>
          )}

          {verification && (
            <div className="space-y-3 rounded-lg border border-gray-700 bg-primary-1 p-3 text-sm">
              <p>
                Hash match:{" "}
                <span
                  className={
                    verification.hashMatch === true
                      ? "text-green-300"
                      : verification.hashMatch === false
                        ? "text-red-300"
                        : "text-label"
                  }
                >
                  {verification.hashMatch === true
                    ? "confirmed"
                    : verification.hashMatch === false
                      ? "mismatch"
                      : "not checked"}
                </span>
              </p>
              <p className="text-label">{verification.formula}</p>
              <div className="max-h-48 overflow-auto rounded bg-primary p-2 font-mono text-[11px]">
                {(verification.result || verification.local?.labels || []).map(
                  (label, index) => (
                    <div key={`${label}-${index}`}>
                      {index}: {label}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

export default CardFairnessModal;
