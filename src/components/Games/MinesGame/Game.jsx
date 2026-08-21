import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import bomb from "../../../assets/boom.png";
import diamond from "../../../assets/diamond.png";
import {
  initializeMinesSocket,
  addMinesGame,
} from "../../../socket/games/mines";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { getActiveWalletType } from "../../../utils/activeWallet";
import { formatMinesMultiplier } from "../../../utils/minesFairness";

const emptyGrid = () =>
  Array(25)
    .fill()
    .map(() => ({ type: "diamond", revealed: false }));

const payoutMultiplier = (profit, stake) => {
  const p = Number(profit);
  const s = Number(stake);
  if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(p)) return "1.00";
  return (1 + p / s).toFixed(2);
};

const overlayMultiplier = (gameState, fallbackMultiplier, stake) => {
  const server = Number(gameState?.multiplier);
  const live = Number(fallbackMultiplier);
  const chosen = Math.max(
    Number.isFinite(server) ? server : 0,
    Number.isFinite(live) ? live : 0
  );
  if (chosen > 0) {
    return formatMinesMultiplier(chosen);
  }
  return payoutMultiplier(gameState?.profit, gameState?.betAmount || stake);
};

const RESULT_HOLD_MS = 3000;

const Game = ({
  mines,
  betStarted,
  setBetStarted,
  setGems,
  setRandomSelect,
  randomSelect,
  gameCheckout,
  setGameCheckout,
  selectBoxes,
  startAutoBet,
  setStartAutoBet,
  selectedBoxes,
  setSelectedBoxes,
  mode,
  nbets,
  setSelectBoxes,
  bet,
  setBet,
  setSidebarDisabled,
  grid,
  setGrid,
  setHistory,
  setFairnessPrefill,
  setMines,
  liveMultiplier = 1,
}) => {
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameProfit, setGameProfit] = useState(0);
  const [gameLoss, setGameLoss] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [resultMultiplier, setResultMultiplier] = useState(null);
  const token = useSelector((state) => state.auth?.token);
  const isLoggedIn = Boolean(token);
  const socketRef = useRef(null);
  const skipAddGameRef = useRef(false);
  const liveMultiplierRef = useRef(1);
  const betRef = useRef(bet);
  betRef.current = bet;
  const betStartedRef = useRef(betStarted);
  betStartedRef.current = betStarted;
  if (!gameCheckout && Number(liveMultiplier) > 0) {
    liveMultiplierRef.current = Number(liveMultiplier);
  }

  const autoGrid = Array.from({ length: 25 });

  useEffect(() => {
    if (!isLoggedIn || !token) {
      return undefined;
    }

    const minesSocket = initializeMinesSocket(token);
    socketRef.current = minesSocket;

    minesSocket.on("game_history", (data) => {
      setHistory(data);
    });
    minesSocket.on("game_state", (gameState) => {
      if (gameState) {
        if (gameState.checkedOut) {
          // Cashout settled server-side: reflect the credit.
          requestWalletRefresh();
          if (gameState.fairness && setFairnessPrefill) {
            setFairnessPrefill(gameState.fairness);
          }
          setGameProfit(gameState.profit || 0);
          setResultMultiplier(
            overlayMultiplier(
              gameState,
              liveMultiplierRef.current,
              betRef.current
            )
          );
          setGameCheckout(true);
          setBetStarted(false);
          setSidebarDisabled(false);
          return;
        }

        if (gameState.message === "New game created") {
          // Bet placed: the stake was just debited.
          requestWalletRefresh();
        }

        if (gameState.multiplier != null && Number(gameState.multiplier) > 0) {
          liveMultiplierRef.current = Number(gameState.multiplier);
        }

        if (gameState.fairness && setFairnessPrefill) {
          setFairnessPrefill(gameState.fairness);
        }

        if (gameState.grid) {
          setGrid(gameState.grid);
        }

        if (gameState.betAmount) {
          setBet(gameState.betAmount);
        }

        if (gameState.mines != null && setMines) {
          setMines(Number(gameState.mines));
        }

        setGems(gameState.gems);
        setGameOver(gameState.gameOver);
        setGameWon(gameState.gameWon);
        setGameProfit(gameState.profit || 0);
        setGameLoss(gameState.loss || 0);

        const shouldResume =
          !gameState.gameOver &&
          !gameState.gameWon &&
          (gameState.hasActiveGame ||
            gameState.message === "Existing game found" ||
            gameState.message === "Continuing existing game");

        if (shouldResume) {
          if (!betStartedRef.current) {
            skipAddGameRef.current = true;
            setBetStarted(true);
          }
          setSidebarDisabled(false);
        } else {
          setSidebarDisabled(false);
        }

        if (gameState.gameOver || gameState.gameWon) {
          setBetStarted(false);
          setSidebarDisabled(false);
          if (gameState.gameWon) {
            setResultMultiplier(
              overlayMultiplier(
                gameState,
                liveMultiplierRef.current,
                betRef.current
              )
            );
          }
        }
      }
    });

    minesSocket.on("game_over", () => {
      // Bust: the stake stays debited, nothing was credited.
      requestWalletRefresh();
      setGameOver(true);
      setBetStarted(false);
      setSidebarDisabled(false);
    });

    minesSocket.on("game_won", () => {
      // Full clear: the payout was credited server-side.
      requestWalletRefresh();
      setGameWon(true);
      setBetStarted(false);
      setSidebarDisabled(false);
    });

    minesSocket.on("error", (error) => {
      requestWalletRefresh();
      const message = error?.message || "Game error";
      if (message !== "No game found") {
        toast.error(message);
      }
      setBetStarted(false);
      setSidebarDisabled(false);
    });

    const askForActiveGame = () => {
      minesSocket.emit("get_active_game");
    };
    minesSocket.on("connect", askForActiveGame);
    if (minesSocket.connected) {
      askForActiveGame();
    }

    return () => {
      minesSocket.off("game_history");
      minesSocket.off("game_state");
      minesSocket.off("game_over");
      minesSocket.off("game_won");
      minesSocket.off("error");
      minesSocket.off("connect", askForActiveGame);
    };
  }, [isLoggedIn, token, setHistory, setFairnessPrefill, setMines]);

  useEffect(() => {
    // socket.io buffers emits until the connection is ready, so we only need
    // the socket to exist — gating on `.connected` here dropped bets placed
    // before the handshake finished.
    if (betStarted && socketRef.current) {
      if (skipAddGameRef.current) {
        skipAddGameRef.current = false;
        return;
      }
      setGrid(emptyGrid());
      setGameOver(false);
      setGameWon(false);
      setGameProfit(0);
      setGameLoss(0);
      setResultMultiplier(null);
      liveMultiplierRef.current = 1;
      addMinesGame(bet, mines, getActiveWalletType());
    }
  }, [betStarted]);

  const handleAutoGridClick = (index) => {
    if (selectedBoxes.includes(index)) {
      setSelectedBoxes((prev) => prev.filter((i) => i !== index));
    } else {
      if (selectedBoxes.length >= 25 - mines) return;
      setSelectedBoxes((prev) => [...prev, index]);
    }
  };

  const handleBoxClick = (index) => {
    if (gameOver || gameWon || grid[index]?.revealed) return;
    if (!betStarted && !startAutoBet) return;

    if (socketRef.current) {
      socketRef.current.emit("reveal", { index });
    }
  };

  useEffect(() => {
    if (randomSelect && !gameOver && !gameWon) {
      const unrevealedTiles = grid
        .map((box, index) => ({ ...box, index }))
        .filter((box) => !box.revealed);

      if (unrevealedTiles.length > 0) {
        const randomBox =
          unrevealedTiles[Math.floor(Math.random() * unrevealedTiles.length)];
        handleBoxClick(randomBox.index);
      }
      setRandomSelect(false);
    }
  }, [randomSelect, gameOver, gameWon, grid]);

  useEffect(() => {
    if (
      mode === "auto" &&
      selectBoxes &&
      startAutoBet &&
      selectedBoxes.length > 0
    ) {
      autoBet(nbets);
    }
  }, [mode, selectBoxes, startAutoBet, selectedBoxes, nbets]);

  const autoBet = async (count) => {
    if (count <= 0) {
      setSelectBoxes(false);
      setStartAutoBet(false);
      return;
    }

    if (socketRef.current) {
      addMinesGame(bet, mines, getActiveWalletType());
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      toast.error("Failed to join game: Socket not connected");
      return;
    }

    let allBoxesOpened = true;
    for (let i = 0; i < selectedBoxes.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      handleBoxClick(selectedBoxes[i]);

      // Wait for game state to update after each box click
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if the clicked box was a bomb
      const clickedBox = grid[selectedBoxes[i]];
      if (clickedBox?.type === "bomb") {
        allBoxesOpened = false;
        break;
      }
    }

    // Only checkout if all boxes were opened successfully and game is not over
    if (allBoxesOpened && !gameOver) {
      if (socketRef.current) {
        socketRef.current.emit("checkout");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Wait for game state to fully update before starting next game
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setTimeout(() => {
      autoBet(count - 1);
      setGrid(emptyGrid());
    }, RESULT_HOLD_MS);
  };

  useEffect(() => {
    if (gameCheckout && !gameOver && !gameWon && socketRef.current) {
      setResultMultiplier(formatMinesMultiplier(liveMultiplierRef.current));
      socketRef.current.emit("checkout");
    }
  }, [gameCheckout, gameOver, gameWon]);

  useEffect(() => {
    if (gameOver || gameWon) {
      setShowModal(true);
      const timer = setTimeout(() => {
        setShowModal(false);
        setGameOver(false);
        setGameWon(false);
        setResultMultiplier(null);
        setGrid(emptyGrid());
      }, RESULT_HOLD_MS);
      return () => clearTimeout(timer);
    }
  }, [gameOver, gameWon]);

  useEffect(() => {
    if (!gameCheckout || resultMultiplier == null) return undefined;
    setShowCheckoutModal(true);
    const timer = setTimeout(() => {
      setShowCheckoutModal(false);
      setGameCheckout(false);
      setResultMultiplier(null);
      setGrid(emptyGrid());
    }, RESULT_HOLD_MS);
    return () => clearTimeout(timer);
  }, [gameCheckout, resultMultiplier]);

  const ResultOverlay = ({ children }) => (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28 }}
      >
        {children}
      </motion.div>
    </div>
  );

  const tileClass = (extra) =>
    `flex h-full min-h-0 min-w-0 w-full items-center justify-center rounded-lg ${extra}`;

  const renderIcon = (box) =>
    box?.revealed ? (
      <img
        src={box.type === "diamond" ? diamond : bomb}
        alt={box.type}
        className="h-[58%] w-[58%] object-contain"
      />
    ) : null;

  // Game Grid View
  return (
    <div className="relative flex h-full w-full items-center justify-center p-2 max-lg:p-2 sm:p-5">
      <div className="mx-auto grid aspect-square w-full max-w-[min(100%,18rem)] grid-cols-5 grid-rows-5 gap-1 max-lg:max-w-[min(100%,16rem)] max-lg:gap-1 sm:max-w-[min(100%,28rem)] sm:gap-2">
        {mode === "auto" &&
          (!selectBoxes
            ? autoGrid.map((_, index) => (
                <motion.button
                  type="button"
                  key={index}
                  className={tileClass(
                    selectedBoxes.includes(index)
                      ? "bg-green-500"
                      : selectedBoxes.length === 25 - Number(mines)
                        ? "bg-gray-950"
                        : "bg-gray-800 hover:bg-gray-700"
                  )}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleAutoGridClick(index)}
                />
              ))
            : grid.map((box, index) => (
                <motion.div
                  key={index}
                  className={tileClass(
                    box.revealed
                      ? "bg-gray-950"
                      : selectedBoxes.includes(index)
                        ? "bg-gray-800"
                        : "bg-gray-700"
                  )}
                >
                  {renderIcon(box)}
                </motion.div>
              )))}

        {mode === "manual" &&
          grid.map((box, index) => (
            <motion.button
              type="button"
              key={index}
              className={tileClass(
                box.revealed ? "bg-gray-950" : "bg-gray-700 hover:bg-gray-600"
              )}
              whileHover={!box.revealed ? { y: -2 } : {}}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleBoxClick(index)}
            >
              {renderIcon(box)}
            </motion.button>
          ))}
      </div>

      {showModal && gameOver && (
        <ResultOverlay>
          <img src={bomb} alt="" className="h-28 w-28 object-contain sm:h-36 sm:w-36" />
        </ResultOverlay>
      )}

      {showModal && gameWon && (
        <ResultOverlay>
          <div className="rounded-xl bg-emerald-500 px-6 py-2 text-4xl font-black text-black shadow-lg lg:text-5xl">
            {resultMultiplier || formatMinesMultiplier(1 + Number(gameProfit) / Number(bet || 1))}x
          </div>
        </ResultOverlay>
      )}

      {showCheckoutModal && (
        <ResultOverlay>
          <div className="rounded-xl bg-emerald-500 px-6 py-2 text-4xl font-black text-black shadow-lg lg:text-5xl">
            {resultMultiplier || formatMinesMultiplier(1 + Number(gameProfit) / Number(bet || 1))}x
          </div>
        </ResultOverlay>
      )}
    </div>
  );
};

export default Game;
