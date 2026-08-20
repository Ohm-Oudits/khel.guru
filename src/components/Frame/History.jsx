import React from "react";

const History = ({ list, onClear, displayOrder = "right-to-left" }) => {
  const getValue = (item) =>
    parseFloat(item.roll ?? item.value ?? item.result ?? item.multiplier);
  const isWinColor = (item) =>
    item.color === "#15803D" || item.color === "green" || item.isWin;

  // Only render items with a real numeric value so a malformed entry never
  // shows up as a "NaN" badge.
  const validList = list.filter((item) => Number.isFinite(getValue(item)));

  // For right-to-left display, we want the most recent items on the right
  const displayList =
    displayOrder === "right-to-left" ? [...validList].reverse() : validList;

  return (
    <div className="relative w-full">
      {onClear && list.length > 0 && (
        <button
          onClick={onClear}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-gray-800/50 hover:bg-gray-800"
        >
          Clear
        </button>
      )}
      <div className="flex justify-end pr-4 flex-nowrap gap-1 items-center py-2 pl-5 w-[95%] ml-[60px] overflow-x-auto">
        {displayList.map((item) => (
          <div
            key={item.id}
            className={`px-2.5 rounded text-[10px] font-semibold whitespace-nowrap ${
              isWinColor(item) ? "bg-green-900/30" : "bg-red-900/30"
            }`}
            style={{ color: isWinColor(item) ? "#15803D" : "#B91C1C" }}
          >
            {getValue(item).toFixed(1)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
