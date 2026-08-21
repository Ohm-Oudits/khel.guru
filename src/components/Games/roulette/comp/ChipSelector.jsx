import { useRef } from "react";
import {
  ROULETTE_CHIP_VALUES,
  formatChipLabel,
} from "../roulette.constants";

export function ChipSelector({ chipBet, setChipBet, disabled = false }) {
  const chipContainerRef = useRef(null);

  const handleScroll = (direction) => {
    chipContainerRef.current?.scrollBy({
      left: direction === "left" ? -160 : 160,
      behavior: "smooth",
    });
  };

  return (
    <div className="mb-4">
      <span className="flex">
        <h3 className="text-sm font-semibold mb-1">Chip Value</h3>
        <h1 className="text-sm ml-auto">${Number(chipBet).toLocaleString()}</h1>
      </span>

      <div className="flex items-center bg-gray-800 rounded-lg p-2 gap-2">
        <button
          type="button"
          onClick={() => handleScroll("left")}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40"
          aria-label="Scroll chips left"
        >
          ◀
        </button>

        <div
          ref={chipContainerRef}
          className="flex flex-1 overflow-x-auto gap-2 scrollbar-hide"
        >
          {ROULETTE_CHIP_VALUES.map((value) => {
            const selected = chipBet === value;
            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => setChipBet(value)}
                className={`flex-shrink-0 relative w-10 h-10 flex items-center justify-center rounded-full shadow-md border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  selected
                    ? "bg-yellow-600 border-yellow-800"
                    : "bg-yellow-500 border-yellow-600 hover:bg-yellow-400"
                }`}
              >
                <span className="text-black font-bold text-xs">
                  {formatChipLabel(value)}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleScroll("right")}
          disabled={disabled}
          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40"
          aria-label="Scroll chips right"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
