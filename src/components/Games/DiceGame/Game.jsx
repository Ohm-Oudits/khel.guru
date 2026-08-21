import { useState, useEffect, useRef } from "react";

const Game = ({
  rollover,
  setRollover,
  fixedPosition,
  setFixedPosition,
  gameResult,
  setGameResult,
  dicePosition,
  setDicePosition,
  Start,
  rollUnder,
  setMultiplier,
  calculateMultiplier,
  winChance,
  targetPosition,
}) => {
  const draggingRef = useRef(false);
  const trackRef = useRef(null);
  const [resultValue, setResultValue] = useState(null);

  useEffect(() => {
    setFixedPosition(rollover);
  }, [rollover]);

  const applyPosition = (raw) => {
    const rounded = Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
    setGameResult("");
    setResultValue(null);
    setFixedPosition(rounded);
    setRollover(rounded);
    const newMultiplier = calculateMultiplier(winChance);
    setMultiplier(parseFloat(newMultiplier).toFixed(2));
    setDicePosition(rounded);
  };

  const positionFromClientX = (clientX) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    return ((clientX - rect.left) / rect.width) * 100;
  };

  const locked = Boolean(Start);

  const handlePointerDown = (e) => {
    if (locked) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const next = positionFromClientX(e.clientX);
    if (next != null) applyPosition(next);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current || locked) return;
    const next = positionFromClientX(e.clientX);
    if (next != null) applyPosition(next);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  useEffect(() => {
    if (Start && targetPosition !== null) {
      setDicePosition(targetPosition);
      setResultValue({
        percentage: targetPosition.toFixed(1),
        multiplier: parseFloat(calculateMultiplier(winChance)).toFixed(2),
      });
    }
  }, [Start, targetPosition, winChance]);

  return (
    <div className="relative flex w-full flex-col items-center justify-center px-3 pt-8 pb-2 lg:px-8 lg:pt-4 lg:pb-2">
      {resultValue && (
        <div className="mb-2 flex h-10 w-full max-w-2xl items-center justify-center">
          <div className="rounded-lg bg-gray-800/80 px-4 py-1.5 text-center backdrop-blur-sm">
            <div className="text-base font-bold leading-tight">
              {resultValue.percentage}
            </div>
            <div className="text-xs text-gray-400">
              {resultValue.multiplier}x
            </div>
          </div>
        </div>
      )}

      <div className="mb-1 flex w-full max-w-2xl justify-between px-1 text-[11px] text-white/60 lg:text-sm">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>

      <div
        ref={trackRef}
        className={`relative h-12 w-full max-w-2xl overflow-visible rounded-lg bg-gray-700 lg:h-16 ${
          locked ? "cursor-not-allowed" : "cursor-pointer"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className={`pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 ${
            rollUnder ? "bg-green-500" : "bg-red-500"
          }`}
          style={{ width: `${fixedPosition}%` }}
        ></div>

        <div
          className={`pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 ${
            rollUnder ? "bg-red-500" : "bg-green-500"
          }`}
          style={{
            left: `${fixedPosition}%`,
            width: `${100 - fixedPosition}%`,
          }}
        ></div>

        <div
          className={`pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-md bg-blue-500 ${
            locked ? "" : "shadow-md"
          }`}
          style={{ left: `${fixedPosition}%` }}
        ></div>

        {Start && (
          <div
            className="pointer-events-none absolute top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-2xl transition-all duration-1000 ease-in-out lg:h-12 lg:w-12"
            style={{ left: `${dicePosition}%` }}
          >
            🎲
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
