import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import gift from "../../../assets/gift.svg";
import { getKenoSocket } from "../../../socket/games/keno";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { toast } from "react-toastify";

const Game = ({
  mines,
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
  setRandomSelect,
  setBetStarted, // Added to reset betStarted
}) => {
  const [grid, setGrid] = useState(
    Array.from({ length: 40 }, () => ({
      type: "diamond",
      revealed: false,
    }))
  );

  useEffect(() => {
    const kenoSocket = getKenoSocket();

    if (!kenoSocket) {
      console.error("Keno socket not initialized in Game component");
      return;
    }

    console.log(
      "Setting up socket listeners in Game component, socket ID:",
      kenoSocket.id
    );

    const handleError = ({ message }) => {
      console.error("Received error from server:", message);
      toast.error(`Error: ${message}`);
      // A rejected bet (e.g. insufficient balance) left the wallet untouched;
      // resync the readout in case it drifted.
      requestWalletRefresh();
    };

    const handleGameResult = ({ grid, gifts, matches, payout }) => {
      console.log("Received game_result in Game:", {
        grid,
        gifts,
        matches,
        payout,
      });
      setGrid(grid);
      setGifts(gifts);
      setWinnedGifts(matches);
      setGameOver(true);
      // Reflect the debit/credit in the in-game balance readout.
      requestWalletRefresh();
    };

    const handleConnect = () => {
      console.log("Keno socket connected in Game, ID:", kenoSocket.id);
    };

    const handleDisconnect = () => {
      console.log("Keno socket disconnected in Game");
    };

    kenoSocket.on("error", handleError);
    kenoSocket.on("game_result", handleGameResult);
    kenoSocket.on("connect", handleConnect);
    kenoSocket.on("disconnect", handleDisconnect);

    return () => {
      console.log("Cleaning up socket listeners in Game component");
      kenoSocket.off("error", handleError);
      kenoSocket.off("game_result", handleGameResult);
      kenoSocket.off("connect", handleConnect);
      kenoSocket.off("disconnect", handleDisconnect);
    };
  }, []);

  const handleBoxClick = (index) => {
    if (betStarted) return;
    if (checkedBoxes.length >= 10 && !checkedBoxes.includes(index)) return;

    setCheckecdBoxes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((element) => element !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleModalClose = () => {
    console.log("Closing modal and resetting game state");
    setGameOver(false);
    setBetStarted(false); // Reset betStarted to allow new bets
    setGifts([]);
    if (!randomSelect) {
      setCheckecdBoxes([]);
    }
    setGrid(
      Array.from({ length: 40 }, () => ({
        type: "diamond",
        revealed: false,
      }))
    );
  };

  const isLimitReached = checkedBoxes.length >= 10;

  return (
    <div className="flex flex-col items-center justify-center py-10 w-full relative">
      <div className="grid grid-cols-8 gap-2 sm:gap-2">
        {grid.map((box, index) => (
          <motion.div
            key={index}
            className={`w-[2.6rem] h-[2.6rem] lg:w-[4.25rem] lg:h-[4.25rem] ${
              checkedBoxes.includes(index)
                ? gifts.includes(index)
                  ? "bg-green-500"
                  : "bg-violet-600 cursor-pointer"
                : gifts.includes(index)
                ? "bg-red-500"
                : isLimitReached
                ? "bg-[rgba(255,255,255,0.1)]"
                : "bg-gray-700 hover:bg-gray-600"
            } duration-${
              isLimitReached ? "0" : "150"
            } rounded-lg flex items-center justify-center font-medium text-opacity-80 ${
              isLimitReached ? "cursor-default" : "cursor-pointer"
            } text-white shadow-lg hover:shadow-2xl`}
            whileHover={!isLimitReached && !box.revealed ? { y: "-2px" } : {}}
            whileTap={!isLimitReached ? { scale: 0.9 } : {}}
            style={{
              boxShadow: isLimitReached ? "none" : "0 5px 1px #2d2b27",
            }}
            onClick={() => handleBoxClick(index)}
          >
            {gifts.includes(index) ? (
              <img src={gift} alt="gift" className="m-2" />
            ) : (
              <div className={`text-xl max-lg:text-base`}>
                {JSON.stringify(index + 1)}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {gameOver && (
        <div
          className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.2)] flex items-center justify-center"
          onClick={handleModalClose}
        >
          <motion.div
            className="text-white w-[95%] max-w-[400px] bg-primary-2 rounded-lg p-6 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Game Result</h2>
            <p className="text-lg mb-2">
              Matches: <span className="font-semibold">{winnedGifts}</span>
            </p>
            <p className="text-lg mb-4">
              Payout Multiplier:{" "}
              <span className="font-semibold">
                {arrayLength > 0 &&
                things[arrayLength - 1]?.values?.[0]?.[winnedGifts]
                  ? things[arrayLength - 1].values[0][winnedGifts]
                  : 0}
                x
              </span>
            </p>
            <button
              className="bg-button-primary text-base text-black px-4 py-2 rounded font-semibold"
              onClick={handleModalClose}
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Game;
