import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gift from "../../../assets/gift.svg";
import { getKenoSocket } from "../../../socket/games/keno";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { toast } from "react-toastify";

const TILES = Array.from({ length: 40 }, () => ({
  type: "diamond",
  revealed: false,
}));

const Game = ({
  betStarted,
  gameOver,
  setGameOver,
  checkedBoxes,
  setCheckecdBoxes,
  gifts,
  setGifts,
  winnedGifts,
  setWinnedGifts,
  things,
  arrayLength,
  randomSelect,
  setBetStarted,
  setFairnessPrefill,
  socketReady,
  onRoundResult,
  autoPicking = false,
}) => {
  const [grid, setGrid] = useState(TILES);
  const [settledMultiplier, setSettledMultiplier] = useState(null);
  const onRoundResultRef = useRef(onRoundResult);
  onRoundResultRef.current = onRoundResult;

  useEffect(() => {
    const kenoSocket = getKenoSocket();
    if (!kenoSocket) return undefined;

    const handleError = ({ message }) => {
      toast.error(`Error: ${message}`);
      setBetStarted(false);
      requestWalletRefresh();
    };

    const handleGameResult = ({
      grid: nextGrid,
      gifts: nextGifts,
      matches,
      payout,
      fairness,
    }) => {
      setGrid(nextGrid);
      setGifts(nextGifts);
      setWinnedGifts(matches);
      setGameOver(true);
      setSettledMultiplier(Number(payout) || 0);
      if (fairness && setFairnessPrefill) {
        setFairnessPrefill(fairness);
      }
      onRoundResultRef.current?.({ payout, matches });
      requestWalletRefresh();
    };

    kenoSocket.on("error", handleError);
    kenoSocket.on("game_result", handleGameResult);

    return () => {
      kenoSocket.off("error", handleError);
      kenoSocket.off("game_result", handleGameResult);
    };
  }, [socketReady, setFairnessPrefill, setGameOver, setGifts, setWinnedGifts, setBetStarted]);

  useEffect(() => {
    if (betStarted && !gameOver) {
      setSettledMultiplier(null);
      setGrid(TILES);
    }
  }, [betStarted, gameOver]);

  useEffect(() => {
    if (!gameOver && !betStarted) {
      setSettledMultiplier(null);
      setGrid(TILES);
    }
  }, [gameOver, betStarted]);

  const handleBoxClick = (index) => {
    if (betStarted || gameOver || autoPicking) return;
    if (checkedBoxes.length >= 10 && !checkedBoxes.includes(index)) return;

    setCheckecdBoxes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((element) => element !== index);
      }
      return [...prev, index];
    });
  };

  const isLimitReached = checkedBoxes.length >= 10;
  const lastPicked = checkedBoxes[checkedBoxes.length - 1];

  return (
    <div className="relative flex w-full max-w-[680px] flex-col items-center justify-center">
      {settledMultiplier != null && (
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-2xl font-bold shadow-lg md:text-4xl ${
            Number(settledMultiplier) <= 0
              ? "bg-red-600 text-white"
              : "bg-button-primary text-black"
          }`}
        >
          {Number(settledMultiplier).toFixed(2)}x
        </div>
      )}
      <div className="grid w-full max-w-[680px] grid-cols-10 gap-1 sm:gap-1.5 lg:gap-2">
        {grid.map((box, index) => {
          const selected = checkedBoxes.includes(index);
          const hit = gifts.includes(index);
          return (
            <motion.div
              key={index}
              className={`flex aspect-square w-full items-center justify-center rounded-md text-sm font-semibold text-white sm:rounded-lg sm:text-base lg:text-xl ${
                selected
                  ? hit
                    ? "bg-green-500"
                    : "bg-violet-600 cursor-pointer"
                  : hit
                    ? "bg-red-500"
                    : isLimitReached
                      ? "cursor-default bg-[rgba(255,255,255,0.1)]"
                      : "cursor-pointer bg-gray-700 hover:bg-gray-600"
              }`}
              whileHover={
                !isLimitReached && !box.revealed && !autoPicking ? { y: "-2px" } : {}
              }
              whileTap={!isLimitReached && !autoPicking ? { scale: 0.95 } : {}}
              animate={
                autoPicking && selected && index === lastPicked
                  ? { scale: [1, 1.16, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.18 }}
              style={{
                boxShadow: isLimitReached ? "none" : "0 4px 0 #2d2b27",
              }}
              onClick={() => handleBoxClick(index)}
            >
              {hit ? (
                <img src={gift} alt="hit" className="h-[55%] w-[55%]" />
              ) : (
                <span>{index + 1}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Game;
