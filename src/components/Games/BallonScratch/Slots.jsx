import { useEffect, useState } from "react";
import {
  computeHighestCounts,
  displaySlots,
  findMatchingSlotIndex,
  slotsData,
} from "./slotConfig";

const DiamondSlots = ({
  diamondCounts,
  slotindex,
  setslotindex,
  compact = false,
  className = "",
}) => {
  const [highest, setHighest] = useState({
    main: { color: "", count: 0 },
    second: { color: "", count: 0 },
  });

  const colorClasses = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    default: "bg-black",
  };

  const freeClasses = [
    "bg-gray-500 relative",
    "bg-black border-2 border-red-400",
  ];

  const iconSize = compact
    ? { width: "12px", height: "12px" }
    : {
        width: "clamp(9px, 1.2vw, 14px)",
        height: "clamp(9px, 1.2vw, 14px)",
      };

  const iconGapClass = compact ? "gap-2" : "";
  const iconMarginClass = compact ? "" : "mx-2";
  const freeMarginClass = compact ? "" : "mx-2 my-[2px]";
  const freeCrossStyle = compact
    ? { width: "2px", height: "10px" }
    : {
        width: "clamp(2px, 0.2vw, 2px)",
        height: "clamp(9px, 1vw, 14px)",
      };

  useEffect(() => {
    setHighest(computeHighestCounts(diamondCounts));
  }, [diamondCounts]);

  useEffect(() => {
    const main = highest.main.count;
    const second = highest.second.count;

    if (main === 0) {
      setslotindex(null);
      return;
    }

    setslotindex(findMatchingSlotIndex(main, second));
  }, [highest, setslotindex]);

  return (
    <div
      className={`flex flex-col text-gray-500 rounded-lg ${
        compact ? "mobile-payout-table gap-1.5 px-0 pb-0 pt-0" : "gap-1 px-4 pt-3 w-full pb-3.5 lg:pt-4"
      } ${className}`}
    >
      <div
        className={`flex items-center justify-between rounded bg-gray-800 ${
          compact ? "px-3 py-2" : "px-3 py-2"
        }`}
      >
        <h2
          className="justify-center font-bold text-yellow-200"
          style={{ fontSize: compact ? "11px" : "clamp(9px, 1.5vw, 100px)" }}
        >
          😛 💰 Jackpot 💰 😛
        </h2>
        <span
          className="font-semibold"
          style={{ fontSize: compact ? "11px" : "clamp(9px, 1vw, 14px)" }}
        >
          1000.00×
        </span>
      </div>
      {displaySlots.map((slot, index) => (
        <div
          key={index}
          className={`flex items-center justify-between rounded bg-gray-800 ${
            compact ? "px-3 py-1.5" : "px-3 py-2"
          }`}
        >
          <div className={`flex items-center ${iconGapClass}`}>
            {[...Array(slot.diamonds)].map((_, i) => (
              <div
                key={`diamond-${i}`}
                style={iconSize}
                className={`${iconMarginClass} shrink-0 rounded-l-sm rounded-r-sm rounded-ss-xl transform rotate-45 ${
                  slotindex === index
                    ? colorClasses[highest.main.color] || colorClasses.default
                    : colorClasses.default
                }`}
              />
            ))}
            {[...Array(slot.different)].map((_, i) => (
              <div
                key={`different-${i}`}
                style={iconSize}
                className={`${iconMarginClass} shrink-0 rounded-l-sm rounded-r-sm rounded-ss-xl transform rotate-45 ${
                  slotindex === index
                    ? colorClasses[highest.second.color] || freeClasses[1]
                    : freeClasses[1]
                }`}
              />
            ))}
            {[...Array(slot.free)].map((_, i) => (
              <div
                key={`free-${i}`}
                style={iconSize}
                className={`relative ${freeMarginClass} shrink-0 rounded-md transform rotate-45 ${freeClasses[0]}`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="bg-gray-300 rotate-0"
                    style={freeCrossStyle}
                  />
                  <div
                    className="absolute bg-gray-300 -rotate-90"
                    style={freeCrossStyle}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className={`text-right transition-opacity duration-300 ${compact ? "pl-3 shrink-0" : "pl-5"}`}>
            <div
              className="font-semibold"
              style={{ fontSize: compact ? "11px" : "clamp(9px, 1vw, 14px)" }}
            >
              {slotsData[index]?.multiplier || "0.00×"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiamondSlots;
