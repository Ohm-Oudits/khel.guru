import { useCallback, useEffect, useState } from "react";
import apiService from "../../../config/api";
import {
  MINES_EVENT_COUNT,
  MINES_FAIRNESS_FORMULA,
  MINES_TILES,
  formatMinesMultiplier,
  hashServerSeed,
  minesMultiplier,
  verifyMinesLayout,
} from "../../../utils/minesFairness";

const copyText = async (value) => {
  if (!value) return;
  await navigator.clipboard.writeText(String(value));
};

const MinesFairnessModal = ({ setIsFairness, prefill = null }) => {
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
  const [mineCount, setMineCount] = useState(
    prefill?.mineCount != null ? String(prefill.mineCount) : "3"
  );
  const [verification, setVerification] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  const loadSeed = useCallback(async () => {
    setLoadingSeed(true);
    try {
      const response = await apiService.games.getFairnessCurrentSeed("mines");
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
    setMineCount(
      prefill.mineCount != null ? String(prefill.mineCount) : "3"
    );
    setTab("verify");
  }, [prefill]);

  const handleRotate = async () => {
    setRotating(true);
    try {
      const response = await apiService.games.rotateFairnessSeed(
        "mines",
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

      const parsedMines = Number.parseInt(mineCount, 10);
      const response = await apiService.games.verifyFairness({
        gameKey: "mines",
        serverSeed,
        clientSeed,
        nonce,
        mineCount: parsedMines,
      });
      const computedHash = await hashServerSeed(serverSeed);
      const expectedHash = serverSeedHash || prefill?.serverSeedHash;
      const local = await verifyMinesLayout({
        serverSeed,
        clientSeed,
        nonce: Number.parseInt(nonce, 10),
        mineCount: parsedMines,
      });

      setVerification({
        ...response.data.verification,
        hashMatch: expectedHash ? computedHash === expectedHash : null,
        local,
      });
    } catch (error) {
      setVerifyError(
        error?.response?.data?.message || "Unable to verify this mines layout."
      );
    } finally {
      setVerifying(false);
    }
  };

  const mines =
    verification?.result || verification?.local?.mines || [];
  const parsedMines = Number.parseInt(mineCount, 10) || 3;

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Provably Fair — Mines</h3>
        <button
          type="button"
          className="text-label"
          onClick={() => setIsFairness(false)}
        >
          Close
        </button>
      </div>

      <p className="mt-2 text-xs text-label">{MINES_FAIRNESS_FORMULA}</p>

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
              Rotate to reveal the previous server seed, then verify past boards.
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
          <FairnessInput
            label="Mine count (1–24)"
            value={mineCount}
            onChange={setMineCount}
          />

          <button
            type="button"
            className="w-full rounded bg-button-primary py-2 text-sm font-semibold text-black"
            disabled={verifying}
            onClick={handleVerify}
          >
            {verifying
              ? "Verifying…"
              : `Verify ${MINES_EVENT_COUNT}-event layout`}
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
              <p className="font-mono text-xs text-label">
                Mines: {mines.join(", ") || "—"}
              </p>
              <div className="mx-auto grid w-fit grid-cols-5 gap-1">
                {Array.from({ length: MINES_TILES }, (_, index) => {
                  const isMine = mines.includes(index);
                  return (
                    <div
                      key={index}
                      className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-semibold ${
                        isMine
                          ? "bg-red-500/80 text-white"
                          : "bg-emerald-500/20 text-emerald-200"
                      }`}
                    >
                      {index}
                    </div>
                  );
                })}
              </div>
              <div className="max-h-40 overflow-auto rounded bg-primary p-2 font-mono text-[11px]">
                {Array.from(
                  { length: MINES_TILES - parsedMines },
                  (_, index) => {
                    const gems = index + 1;
                    return (
                      <div key={gems}>
                        {gems} gem{gems === 1 ? "" : "s"}:{" "}
                        {formatMinesMultiplier(
                          minesMultiplier(parsedMines, gems)
                        )}
                        x
                      </div>
                    );
                  }
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

export default MinesFairnessModal;
