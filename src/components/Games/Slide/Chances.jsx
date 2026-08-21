import { useEffect, useState } from "react";

const SLIDE_RTP = 0.98;
const MIN_TARGET = 1.01;
const MAX_TARGET = 100000;

const slideWinChance = (multiplier) => {
  const target = parseFloat(multiplier);
  if (!Number.isFinite(target) || target < MIN_TARGET) return "0.00";
  return Math.max(0, (SLIDE_RTP / target) * 100).toFixed(2);
};

const BetCalculator = ({
  playerTarget,
  setPlayerTarget,
  disabled = false,
}) => {
  const [winChance, setWinChance] = useState(() => slideWinChance(playerTarget));

  useEffect(() => {
    setWinChance(slideWinChance(playerTarget || MIN_TARGET));
  }, [playerTarget]);

  const handleMultiplierChange = (event) => {
    const value = event.target.value;
    if (value === "") {
      setPlayerTarget("");
      return;
    }
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= MAX_TARGET) {
      setPlayerTarget(value);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(playerTarget);
    if (!Number.isFinite(parsed) || parsed < MIN_TARGET) {
      setPlayerTarget(2);
    }
  };

  return (
    <div className="mx-auto flex w-[98%] justify-between rounded-lg bg-gray-800 p-2 text-white font-sans">
      <div className="flex w-1/2 flex-col pr-2">
        <label className="mb-1 text-sm text-gray-400">Target Multiplier</label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            max={MAX_TARGET}
            min={MIN_TARGET}
            disabled={disabled}
            value={playerTarget}
            onChange={handleMultiplierChange}
            onBlur={handleBlur}
            className="no-spin-on-hover h-10 w-full rounded border border-gray-600 bg-gray-700 px-3 text-left text-white focus:border-blue-500 focus:outline-none"
            style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)" }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-400">
            x
          </span>
        </div>
      </div>

      <div className="flex w-1/2 flex-col pl-2">
        <label className="mb-1 text-sm text-gray-400">Win Chance</label>
        <div className="relative">
          <input
            type="text"
            value={winChance}
            readOnly
            disabled={disabled}
            className="h-10 w-full rounded border border-gray-600 bg-gray-700 px-3 text-left text-white focus:outline-none"
            style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)" }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400">
            %
          </span>
        </div>
      </div>
    </div>
  );
};

export default BetCalculator;
