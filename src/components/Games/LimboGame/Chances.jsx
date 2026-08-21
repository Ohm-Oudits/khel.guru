/* eslint-disable */
import { useState, useEffect } from "react";
import "../../../styles/Limbo.css";

const BetCalculator = ({
  setEstProfit,
  bet,
  setMultiplier,
  targetMultiplier,
  setDefaultColor,
  bettingStarted,
  setTargetMultiplier,
  startAutoBet,
}) => {
  const [winChance, setWinChance] = useState(98.9999);

  useEffect(() => {
    const newWinChance = calculateWinChance(targetMultiplier || 1.01);
    setWinChance(newWinChance);
  }, [targetMultiplier]);

  const calculateWinChance = (multiplier) => {
    const rawChance = ((100 - multiplier) / 100) * 100;

    const houseEdge = 1;
    const finalChance = Math.max(rawChance - houseEdge, 0);

    return finalChance.toFixed(4);
  };

  const handleMultiplierChange = (e) => {
    const value = e.target.value;
    setDefaultColor(true);
    if (
      value === "" ||
      (parseFloat(value) >= 1 && parseFloat(value) <= 100000)
    ) {
      setTargetMultiplier(value);
      setMultiplier(value || 0);
    }
  };

  const handleBlur = () => {
    if (
      targetMultiplier === "" ||
      targetMultiplier == 1 ||
      targetMultiplier === null
    ) {
      setTargetMultiplier(1.01);
      setMultiplier(1.01);
    }
  };

  const handleFocus = () => {
    if (targetMultiplier === 1.01) {
      setTargetMultiplier("");
    }
  };

  useEffect(() => {
    if (targetMultiplier) {
      const betAmount = parseFloat(bet) || 0;
      const multiplier = parseFloat(targetMultiplier) || 0;
      const potentialWin = betAmount * multiplier;
      const profit = potentialWin - betAmount;
      setEstProfit(profit.toFixed(6));
    } else {
      setEstProfit("0.000000");
    }
  }, [bet, targetMultiplier]);

  return (
    <div className="flex w-full justify-between gap-2 rounded-lg bg-gray-800 p-2 text-white font-sans">
      {/* Target Multiplier Field */}
      <div className="flex flex-col w-1/2 pr-2">
        <label className="mb-1 text-sm text-gray-400">Target Multiplier</label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            max="100000"
            min="1.01"
            disabled={bettingStarted || startAutoBet}
            value={targetMultiplier}
            onChange={handleMultiplierChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            style={{
              fontSize: "clamp(1.4rem, 1.5vw, 1.5rem)",
              lineHeight: "clamp(2rem, 1.5vw, 1.5rem)",
              padding: "clamp(0.4rem, 0.8vw, 0.3rem)",
            }}
            className="w-full px-3 text-left text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 no-spin-on-hover"
          />
          <span className="absolute right-3 top-[50%] transform -translate-y-1/2 text-gray-400">
            x
          </span>
        </div>
      </div>

      {/* Win Chance Field */}
      <div className="flex flex-col w-1/2 pl-2">
        <label className="mb-1 text-sm text-gray-400">Win Chance</label>
        <div className="relative">
          <input
            type="text"
            value={winChance}
            disabled={bettingStarted || startAutoBet}
            readOnly
            style={{
              fontSize: "clamp(1.4rem, 1.5vw, 1.5rem)",
              lineHeight: "clamp(2rem, 2vw, 1.5rem)",
              padding: "clamp(0.4rem, 0.8vw, 0.3rem)",
            }}
            className="w-full px-3 text-left text-white bg-gray-700 border border-gray-600 rounded focus:outline-none"
          />
          <span className="absolute right-3 top-[50%] transform -translate-y-1/2 text-gray-400">
            %
          </span>
        </div>
      </div>
    </div>
  );
};

export default BetCalculator;
