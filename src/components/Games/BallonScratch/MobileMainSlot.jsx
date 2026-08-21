import { useEffect, useMemo, useRef, useState } from "react";
import DiamondSlots from "./Slots";
import {
  computeHighestCounts,
  getMobileBarCounts,
  MOBILE_BAR_ICONS,
  findMatchingSlotIndex,
} from "./slotConfig";

export { normalizeDiamondCounts } from "./slotConfig";

const colorClasses = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  default: "bg-black",
};

const freeClasses = ["bg-gray-500 relative", "bg-black border-2 border-red-400"];

const LONG_PRESS_MS = 420;

const MobileSlot = ({ diamondCounts, setslotindex, gridHeight = 0 }) => {
  const [showPayoutTable, setShowPayoutTable] = useState(false);
  const longPressTimerRef = useRef(null);
  const longPressOpenedRef = useRef(false);

  const highest = useMemo(
    () => computeHighestCounts(diamondCounts),
    [diamondCounts]
  );

  const main = highest.main.count;
  const second = highest.second.count;
  const matchedIndex = findMatchingSlotIndex(main, second);
  const bar = getMobileBarCounts(main, second, matchedIndex);

  useEffect(() => {
    if (!setslotindex) return;
    setslotindex(matchedIndex);
  }, [matchedIndex, setslotindex]);

  useEffect(() => {
    if (!showPayoutTable) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setShowPayoutTable(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPayoutTable]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openPayoutTable = () => setShowPayoutTable(true);
  const closePayoutTable = () => setShowPayoutTable(false);

  const handlePointerDown = () => {
    longPressOpenedRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressOpenedRef.current = true;
      openPayoutTable();
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    clearLongPressTimer();
    if (!longPressOpenedRef.current) {
      setShowPayoutTable((prev) => !prev);
    }
  };

  const handlePointerCancel = () => {
    clearLongPressTimer();
    longPressOpenedRef.current = false;
  };

  const renderFreeIcon = (key) => (
    <div
      key={key}
      className={`mobile-slot-icon mobile-slot-icon--vertical rounded-md transform rotate-45 ${freeClasses[0]}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[2px] h-[10px] bg-gray-300 rotate-0" />
        <div className="w-[2px] h-[10px] bg-gray-300 -rotate-90 absolute" />
      </div>
    </div>
  );

  const renderGemIcon = (key, color) => (
    <div
      key={key}
      className={`mobile-slot-icon mobile-slot-icon--vertical rounded-l-sm rounded-r-sm rounded-ss-xl transform rotate-45 ${
        colorClasses[color] || colorClasses.default
      }`}
    />
  );

  const railStyle = gridHeight > 0 ? { height: gridHeight } : undefined;

  return (
    <>
      <div
        className="mobile-slot-rail flex shrink-0 touch-manipulation select-none"
        style={railStyle}
      >
        <button
          type="button"
          aria-label="Show payout table"
          aria-expanded={showPayoutTable}
          className="mobile-slot-column flex h-full w-full flex-col rounded-md bg-gray-800 text-gray-500"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerCancel}
          onPointerCancel={handlePointerCancel}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="mobile-slot-icons mobile-slot-icons--vertical flex min-h-0 flex-1 flex-col items-center">
            {bar.idle
              ? Array.from({ length: MOBILE_BAR_ICONS }).map((_, i) =>
                  renderFreeIcon(`idle-${i}`)
                )
              : (
                <>
                  {[...Array(bar.diamonds)].map((_, i) =>
                    renderGemIcon(`diamond-${i}`, highest.main.color)
                  )}
                  {[...Array(bar.different)].map((_, i) =>
                    renderGemIcon(`different-${i}`, highest.second.color)
                  )}
                  {[...Array(bar.free)].map((_, i) => renderFreeIcon(`free-${i}`))}
                </>
              )}
          </div>
        </button>
      </div>

      {showPayoutTable && (
        <div className="mobile-payout-overlay" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close payout table"
            className="mobile-payout-backdrop"
            onClick={closePayoutTable}
          />
          <div className="mobile-payout-sheet">
            <div className="mobile-payout-sheet__header">
              <span className="text-sm font-semibold text-white">Payouts</span>
              <button
                type="button"
                className="mobile-payout-close"
                onClick={closePayoutTable}
              >
                ✕
              </button>
            </div>
            <div className="mobile-payout-sheet__body custom-scrollbar">
              <DiamondSlots
                diamondCounts={diamondCounts}
                slotindex={matchedIndex}
                setslotindex={setslotindex}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileSlot;
