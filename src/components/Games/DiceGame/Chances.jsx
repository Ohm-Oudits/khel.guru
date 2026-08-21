import { useEffect, useCallback } from "react";
import { FaSyncAlt } from "react-icons/fa";

const BetCalculator = ({
  rollUnder,
  setRollUnder,
  roll,
  setRoll,
  targetMultiplier,
  setTargetMultiplier,
  winChance,
}) => {
  const calculateRollFromMultiplier = useCallback(
    (multiplier) => {
      const houseEdge = 1;
      const winChance = (100 - houseEdge) / multiplier;
      // For roll over, we need to invert the win chance
      return rollUnder ? winChance : 100 - winChance;
    },
    [rollUnder]
  );

  const calculateMultiplierFromRoll = useCallback(
    (rollValue) => {
      const houseEdge = 1;
      // For roll over, we need to invert the win chance
      const winChance = rollUnder ? rollValue : 100 - rollValue;
      return (100 - houseEdge) / winChance;
    },
    [rollUnder]
  );

  // Update roll when multiplier changes
  useEffect(() => {
    if (targetMultiplier && !isNaN(parseFloat(targetMultiplier))) {
      const newRoll = calculateRollFromMultiplier(parseFloat(targetMultiplier));
      setRoll(newRoll.toFixed(2));
    }
  }, [targetMultiplier, rollUnder, calculateRollFromMultiplier]);

  // Update multiplier when roll changes
  useEffect(() => {
    if (roll && !isNaN(parseFloat(roll))) {
      const newMultiplier = calculateMultiplierFromRoll(parseFloat(roll));
      setTargetMultiplier(newMultiplier.toFixed(2));
    }
  }, [roll, rollUnder, calculateMultiplierFromRoll]);

  const handleRollToggle = useCallback(() => {
    setRollUnder((prev) => {
      const newRollUnder = !prev;
      // Only recalculate if we have a valid multiplier
      if (targetMultiplier && !isNaN(parseFloat(targetMultiplier))) {
        const newRoll = calculateRollFromMultiplier(
          parseFloat(targetMultiplier)
        );
        // Use setTimeout to avoid state update conflicts
        setTimeout(() => {
          setRoll(newRoll.toFixed(2));
        }, 0);
      }
      return newRollUnder;
    });
  }, [targetMultiplier, calculateRollFromMultiplier, setRollUnder, setRoll]);

  return (
    <div className="flex w-full justify-between gap-1 rounded-lg bg-gray-800 p-2 text-white font-sans">
      {/* Target Multiplier Input */}
      <div className="flex flex-col w-1/3 pr-2">
        <label
          className="mb-1 text-sm text-gray-400"
          style={{
            fontSize: "clamp(0.7rem, 0.8vw, 0.9rem)",
          }}
        >
          Target Multiplier
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            max="100"
            min="1.01"
            value={targetMultiplier}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value >= 1.01 && value <= 100) {
                setTargetMultiplier(value.toFixed(2));
              }
            }}
            className="w-full px-3 py-1.5 text-left text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 no-spin-on-hover"
            style={{
              fontSize: "clamp(1rem, 1.5vw, 1.5rem)",
              height: "40px",
            }}
          />
          <span className="absolute right-3 top-[50%] transform -translate-y-1/2 text-gray-400 text-xl">
            x
          </span>
        </div>
      </div>

      {/* Roll Over/Under Input with Rotate Icon */}
      <div
        className="flex flex-col cursor-pointer w-1/3 pr-2"
        onClick={handleRollToggle}
      >
        <label
          className="mb-1 text-sm text-gray-400"
          style={{
            fontSize: "clamp(0.7rem, 0.8vw, 0.9rem)",
          }}
        >
          {rollUnder ? "Roll Under" : "Roll Over"}
        </label>
        <div className="relative">
          <input
            value={parseFloat(roll).toFixed(2)}
            readOnly
            className="w-full px-3 cursor-pointer py-1.5 text-left text-white bg-gray-700 border border-gray-600 rounded focus:outline-none"
            style={{
              fontSize: "clamp(1rem, 1.5vw, 1.5rem)",
              height: "40px",
            }}
          />
          <FaSyncAlt className="absolute cursor-pointer right-3 top-[50%] transform -translate-y-1/2 text-gray-400 text-sm" />
        </div>
      </div>

      {/* Win Chance Display */}
      <div className="flex flex-col w-1/3">
        <label
          className="mb-1 text-sm text-gray-400"
          style={{
            fontSize: "clamp(0.7rem, 0.8vw, 0.9rem)",
          }}
        >
          Win Chance
        </label>
        <div className="relative">
          <input
            type="text"
            value={parseFloat(winChance).toFixed(1)}
            readOnly
            className="w-full px-3 py-1.5 text-left text-white bg-gray-700 border border-gray-600 rounded focus:outline-none"
            style={{
              fontSize: "clamp(1rem, 1.5vw, 1.5rem)",
              height: "40px",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BetCalculator;
