import { useState } from "react";
import { ROULETTE_RED_NUMBERS } from "../roulette.constants";

const numbers = [
  0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 2, 5, 8, 11, 14, 17, 20, 23,
  26, 29, 32, 35, 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34,
];

const getNumberColor = (num, redNumbers) => {
  if (num === 0) return "bg-green-600 hover:bg-green-700";
  return redNumbers.includes(num)
    ? "bg-red-600 hover:bg-red-700"
    : "bg-black hover:bg-gray-800";
};

const outsideBetClass = (group, isProcessing) =>
  `relative rounded transition-colors min-h-[36px] max-lg:min-h-[34px] px-1 py-2 text-xs max-lg:text-[0.7rem] lg:text-sm font-medium ${
    group === "red"
      ? "bg-red-600 hover:bg-red-700"
      : group === "black"
        ? "bg-black hover:bg-gray-800"
        : "bg-zinc-800 hover:bg-zinc-700"
  } ${isProcessing ? "opacity-50 cursor-not-allowed" : "text-white"}`;

export function BettingBoard({
  onPlaceBet,
  currentBets,
  red = ROULETTE_RED_NUMBERS,
  isProcessing,
}) {
  const [hoverRange, setHoverRange] = useState(null);

  const isHighlighted = (number) => {
    if (!hoverRange) return false;

    if (hoverRange === number) {
      return true;
    }

    const groupHighlights = {
      red: (n) => red.includes(n),
      black: (n) => !red.includes(n) && n !== 0,
      even: (n) => n !== 0 && n % 2 === 0,
      odd: (n) => n !== 0 && n % 2 === 1,
      "1-18": (n) => n >= 1 && n <= 18,
      "19-36": (n) => n >= 19 && n <= 36,
      row1: (n) => n !== 0 && n % 3 === 0,
      row2: (n) => n !== 0 && n % 3 === 2,
      row3: (n) => n !== 0 && n % 3 === 1,
    };

    if (hoverRange in groupHighlights) {
      return groupHighlights[hoverRange](number);
    }

    if (typeof hoverRange === "string" && hoverRange.includes("-")) {
      const [start, end] = hoverRange.split("-").map(Number);
      return number >= start && number <= end;
    }

    return false;
  };

  const renderBetChip = (key) =>
    currentBets[key] > 0 ? (
      <span className="absolute bottom-0.5 right-0.5 max-lg:bottom-0 max-lg:right-0 bg-white text-black text-[0.6rem] max-lg:text-[0.55rem] leading-none px-1 py-0.5 rounded">
        ${currentBets[key]}
      </span>
    ) : null;

  return (
    <div className="relative mx-auto mt-1 w-full min-w-0 max-w-full max-lg:-mt-1 max-lg:mt-0">
      {Object.values(currentBets).some((bet) => bet > 0) && (
        <div className="flex justify-end mb-2 max-lg:mb-1">
          <button
            type="button"
            className={`text-sm max-lg:text-xs font-medium px-4 max-lg:px-3 py-1.5 rounded-sm ${
              isProcessing
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
            onClick={() => !isProcessing && onPlaceBet("clear")}
            disabled={isProcessing}
          >
            Clear
          </button>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-12 gap-0.5 max-lg:gap-px">
        <button
          type="button"
          onClick={() => !isProcessing && onPlaceBet(0)}
          className={`${getNumberColor(0, red)} ${
            isProcessing ? "opacity-50 cursor-not-allowed" : ""
          } col-span-1 min-w-0 text-white font-bold py-6 max-lg:py-4 lg:py-8 rounded transition-colors relative`}
        >
          0
          {renderBetChip(0)}
        </button>

        <div className="col-span-10 grid min-w-0 grid-cols-12 gap-0.5 max-lg:gap-px">
          {numbers.slice(1).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => !isProcessing && onPlaceBet(number)}
              onMouseEnter={() => setHoverRange(number)}
              onMouseLeave={() => setHoverRange(null)}
              className={`${getNumberColor(number, red)} ${
                isHighlighted(number) ? "ring-1 ring-yellow-400 ring-inset" : ""
              } ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              } min-w-0 text-white font-bold rounded transition-colors relative min-h-[28px] max-lg:min-h-[26px] lg:min-h-[32px]`}
            >
              <div className="text-[0.72rem] max-lg:text-[0.62rem] lg:text-[0.8rem]">
                {number}
              </div>
              {renderBetChip(number)}
            </button>
          ))}
        </div>

        <div className="col-span-1 grid min-w-0 grid-rows-3 gap-0.5 max-lg:gap-px">
          {["row1", "row2", "row3"].map((row) => (
            <button
              key={row}
              type="button"
              className={`bg-zinc-800 hover:bg-zinc-700 relative text-[0.7rem] max-lg:text-[0.62rem] lg:text-sm p-1.5 max-lg:p-1 text-white rounded transition-colors ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onMouseEnter={() => setHoverRange(row)}
              onMouseLeave={() => setHoverRange(null)}
              onClick={() => !isProcessing && onPlaceBet(row)}
            >
              2:1
              {renderBetChip(row)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1.5 grid min-w-0 grid-cols-12 gap-1 max-lg:mt-1 max-lg:gap-0.5">
        <div className="hidden lg:block col-span-1" aria-hidden />
        <div className="col-span-12 grid min-w-0 grid-cols-3 gap-1 max-lg:gap-0.5 lg:col-span-10">
          {["1-12", "13-24", "25-36"].map((group) => (
            <button
              key={group}
              type="button"
              className={`${outsideBetClass(group, isProcessing)} min-w-0`}
              onMouseEnter={() => setHoverRange(group)}
              onMouseLeave={() => setHoverRange(null)}
              onClick={() => !isProcessing && onPlaceBet(group)}
            >
              {group}
              {renderBetChip(group)}
            </button>
          ))}
        </div>
        <div className="hidden lg:block col-span-1" aria-hidden />
      </div>

      <div className="mt-1.5 grid min-w-0 grid-cols-12 gap-1 max-lg:mt-1 max-lg:gap-0.5">
        <div className="hidden lg:block col-span-1" aria-hidden />
        <div className="col-span-12 grid min-w-0 grid-cols-3 gap-1 max-lg:gap-0.5 lg:col-span-10 lg:grid-cols-6">
          {["1-18", "even", "red", "black", "odd", "19-36"].map((group) => (
            <button
              key={group}
              type="button"
              className={`${outsideBetClass(group, isProcessing)} min-w-0`}
              onMouseEnter={() => setHoverRange(group)}
              onMouseLeave={() => setHoverRange(null)}
              onClick={() => !isProcessing && onPlaceBet(group)}
            >
              {group === "even" || group === "odd"
                ? group.charAt(0).toUpperCase() + group.slice(1)
                : group === "red" || group === "black"
                  ? group.charAt(0).toUpperCase() + group.slice(1)
                  : group}
              {renderBetChip(group)}
            </button>
          ))}
        </div>
        <div className="hidden lg:block col-span-1" aria-hidden />
      </div>
    </div>
  );
}
