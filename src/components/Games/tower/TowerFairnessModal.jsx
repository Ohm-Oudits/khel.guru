import { useCallback, useEffect, useMemo, useState } from "react";
import apiService from "../../../config/api";
import {
  computeTowerProgressMultiplier,
  formatTowerMultiplier,
} from "./towerMultiplier";
import {
  hashServerSeed,
  normalizeTowerDifficulty,
  validateSelectedBoxesAgainstGrid,
  verifyTowerLayout,
} from "../../../utils/towerFairness";
import { loadTowerRoundHistory } from "../../../utils/towerRoundHistory";
import "./tower.css";

const TOWER_GAME_KEY = "tower";
const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Extreme", "Nightmare"];

const copyText = async (value) => {
  if (!value) return;
  await navigator.clipboard.writeText(String(value));
};

const TowerFairnessModal = ({ setIsFairness, prefill = null }) => {
  const [tab, setTab] = useState(prefill ? "verify" : "seeds");
  const [loadingSeed, setLoadingSeed] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [currentSeed, setCurrentSeed] = useState(null);
  const [revealedSeed, setRevealedSeed] = useState(null);
  const [nextClientSeed, setNextClientSeed] = useState("");
  const [clientSeed, setClientSeed] = useState(prefill?.clientSeed || "");
  const [serverSeed, setServerSeed] = useState("");
  const [serverSeedHash, setServerSeedHash] = useState(
    prefill?.serverSeedHash || ""
  );
  const [nonce, setNonce] = useState(
    prefill?.nonce != null ? String(prefill.nonce) : "0"
  );
  const [difficulty, setDifficulty] = useState(prefill?.difficulty || "Easy");
  const [verification, setVerification] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [hashMatch, setHashMatch] = useState(null);
  const [roundHistory, setRoundHistory] = useState([]);

  const selectedRound = useMemo(
    () =>
      roundHistory.find(
        (round) =>
          String(round.nonce) === String(nonce) &&
          round.clientSeed === clientSeed
      ) || prefill,
    [roundHistory, nonce, clientSeed, prefill]
  );

  const payoutRows = useMemo(() => {
    const rows = 9;
    return Array.from({ length: rows }, (_, index) => {
      const progress = index + 1;
      return {
        progress,
        multiplier: computeTowerProgressMultiplier(difficulty, progress, rows),
      };
    });
  }, [difficulty]);

  const loadSeed = useCallback(async () => {
    setLoadingSeed(true);
    try {
      const response = await apiService.games.getFairnessCurrentSeed(
        TOWER_GAME_KEY
      );
      setCurrentSeed(response.data.seed);
    } catch {
      setCurrentSeed(null);
    } finally {
      setLoadingSeed(false);
    }
  }, []);

  useEffect(() => {
    loadSeed();
    setRoundHistory(loadTowerRoundHistory());
    setNextClientSeed(
      crypto.randomUUID?.().replace(/-/g, "").slice(0, 16) ||
        Math.random().toString(36).slice(2, 10)
    );
  }, [loadSeed]);

  useEffect(() => {
    if (!prefill) return;
    setClientSeed(prefill.clientSeed || "");
    setServerSeedHash(prefill.serverSeedHash || "");
    setNonce(prefill.nonce != null ? String(prefill.nonce) : "0");
    setDifficulty(
      prefill.difficulty
        ? prefill.difficulty.charAt(0).toUpperCase() +
            prefill.difficulty.slice(1)
        : "Easy"
    );
    setTab("verify");
  }, [prefill]);

  const handleRotate = async () => {
    setRotating(true);
    setVerifyError("");
    try {
      const response = await apiService.games.rotateFairnessSeed(
        TOWER_GAME_KEY,
        { clientSeed: nextClientSeed || undefined }
      );
      setRevealedSeed(response.data.previousSeed);
      setServerSeed(response.data.previousSeed?.serverSeed || "");
      setCurrentSeed(response.data.nextSeed);
      setNextClientSeed(
        crypto.randomUUID?.().replace(/-/g, "").slice(0, 16) ||
          Math.random().toString(36).slice(2, 10)
      );
      await loadSeed();
    } catch (error) {
      setVerifyError(error.response?.data?.message || "Failed to rotate seed");
    } finally {
      setRotating(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError("");
    setVerification(null);
    setHashMatch(null);

    try {
      if (!serverSeed || !clientSeed) {
        throw new Error("Server seed and client seed are required");
      }

      const parsedNonce = Number.parseInt(nonce, 10);
      if (!Number.isFinite(parsedNonce) || parsedNonce < 0) {
        throw new Error("Nonce must be a non-negative integer");
      }

      const local = await verifyTowerLayout({
        serverSeed,
        clientSeed,
        nonce: parsedNonce,
        difficulty,
      });

      const computedHash = await hashServerSeed(serverSeed);
      const expectedHash = serverSeedHash || selectedRound?.serverSeedHash;
      setHashMatch(expectedHash ? computedHash === expectedHash : null);

      let apiVerification = null;
      try {
        const response = await apiService.games.verifyFairness({
          gameKey: TOWER_GAME_KEY,
          serverSeed,
          clientSeed,
          nonce: parsedNonce,
          difficulty,
        });
        apiVerification = response.data.verification;
      } catch {
        apiVerification = null;
      }

      const pickValidation = selectedRound?.grid
        ? validateSelectedBoxesAgainstGrid(
            selectedRound.selectedBoxes || [],
            local.grid
          )
        : null;

      setVerification({
        local,
        apiVerification,
        pickValidation,
        computedHash,
        expectedHash,
      });
    } catch (error) {
      setVerifyError(error.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const renderGrid = (grid, cols) => {
    if (!grid?.length) return null;

    return (
      <div className="tower-fairness-grid" style={{ "--tower-cols": cols }}>
        {grid.map((row, rowIndex) => (
          <div key={`pf-row-${rowIndex}`} className="tower-fairness-grid__row">
            {row.map((cell, colIndex) => (
              <div
                key={`pf-cell-${rowIndex}-${colIndex}`}
                className={`tower-fairness-grid__cell ${
                  cell.isCorrect
                    ? "tower-fairness-grid__cell--egg"
                    : "tower-fairness-grid__cell--trap"
                } ${cell.revealed ? "tower-fairness-grid__cell--revealed" : ""}`}
                title={cell.isCorrect ? "Egg" : "Trap"}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="tower-fairness-modal px-4 pb-4 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tower Fairness</h2>
        <button
          type="button"
          className="text-label hover:text-white"
          onClick={() => setIsFairness(false)}
          aria-label="Close fairness modal"
        >
          ✕
        </button>
      </div>

      <div className="switch mt-4 grid w-full max-w-[260px] grid-cols-2 gap-1 rounded-full bg-inactive p-0.5">
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
              className="tower-panel-btn mt-3 w-full bg-button-primary text-black"
              disabled={rotating}
              onClick={handleRotate}
            >
              {rotating ? "Rotating…" : "Rotate seed pair"}
            </button>
          </div>

          {revealedSeed?.serverSeed && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm">
              <p className="font-semibold text-green-300">Previous server seed revealed</p>
              <p className="mt-2 break-all font-mono text-xs">
                {revealedSeed.serverSeed}
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "verify" && (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold uppercase text-label">
            Difficulty
          </label>
          <select
            className="w-full rounded border border-input bg-input p-2 text-sm"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

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
            label="Server seed hash (from round)"
            value={serverSeedHash}
            onChange={setServerSeedHash}
          />
          <FairnessInput label="Nonce" value={nonce} onChange={setNonce} />

          {roundHistory.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase text-label">
                Saved rounds
              </label>
              <select
                className="mt-1 w-full rounded border border-input bg-input p-2 text-sm"
                onChange={(event) => {
                  const round = roundHistory.find(
                    (item) => item.savedAt === event.target.value
                  );
                  if (!round) return;
                  setClientSeed(round.clientSeed || "");
                  setServerSeedHash(round.serverSeedHash || "");
                  setNonce(String(round.nonce ?? 0));
                  setDifficulty(
                    round.difficulty
                      ? round.difficulty.charAt(0).toUpperCase() +
                          normalizeTowerDifficulty(round.difficulty).slice(1)
                      : "Easy"
                  );
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Load a saved round
                </option>
                {roundHistory.map((round) => (
                  <option key={round.savedAt} value={round.savedAt}>
                    nonce {round.nonce} · {round.outcome} · {round.difficulty}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="tower-panel-btn w-full bg-button-primary text-black"
            disabled={verifying}
            onClick={handleVerify}
          >
            {verifying ? "Verifying…" : "Verify layout & payout rules"}
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
              <p className="text-label">
                Formula: HMAC_SHA256(serverSeed, clientSeed:nonce:round) → floats
                → Fisher-Yates egg columns per row
              </p>
              <p>
                Checkout: bet × {verification.local.maxMultiplier} × (progress / 9)
              </p>
              <p>Full win: bet × {verification.local.maxMultiplier}</p>

              {verification.pickValidation && (
                <p>
                  Saved picks vs verified layout:{" "}
                  {verification.pickValidation.valid ? (
                    <span className="text-green-300">valid</span>
                  ) : (
                    <span className="text-red-300">mismatch</span>
                  )}
                </p>
              )}

              {selectedRound?.profit != null && selectedRound?.betAmount != null && (
                <p>
                  Recorded payout: {selectedRound.profit} on bet{" "}
                  {selectedRound.betAmount} ({selectedRound.outcome})
                </p>
              )}

              {renderGrid(verification.local.grid, verification.local.cols)}

              <div className="max-h-40 overflow-auto rounded bg-primary p-2 font-mono text-[11px]">
                {verification.local.eggLevels.map((columns, index) => (
                  <div key={`egg-level-${index}`}>
                    Row {index}: eggs at columns [{columns.join(", ")}]
                  </div>
                ))}
              </div>

              <div className="rounded bg-primary p-2 text-xs text-label">
                <p className="mb-1 font-semibold text-white">Payout ladder</p>
                {payoutRows.map((row) => (
                  <div key={`payout-${row.progress}`}>
                    {row.progress} row(s): {formatTowerMultiplier(row.multiplier)}x
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FairnessField = ({ label, value, onCopy }) => (
  <div>
    <label className="block text-xs font-semibold uppercase text-label">
      {label}
    </label>
    <div className="mt-1 flex">
      <input
        className="w-full rounded-l border border-input bg-input p-2 text-xs"
        value={value ?? ""}
        readOnly
      />
      <button
        type="button"
        className="rounded-r border border-input bg-primary-4 px-3 text-xs"
        onClick={() => onCopy(value)}
      >
        Copy
      </button>
    </div>
  </div>
);

const FairnessInput = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-semibold uppercase text-label">
      {label}
    </label>
    <input
      className="mt-1 w-full rounded border border-input bg-input p-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

export default TowerFairnessModal;
