import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import bomb from "../../../assets/boom.png";
import diamond from "../../../assets/diamond.png";
import {
  getMinesSocket,
  initializeMinesSocket,
  addMinesGame,
} from "../../../socket/games/mines";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import checkLoggedIn from "../../../utils/isloggedIn";
import { requestWalletRefresh } from "../../../utils/walletEvents";

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
}) => {
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameProfit, setGameProfit] = useState(0);
  const [gameLoss, setGameLoss] = useState(0);
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [showGameOptions, setShowGameOptions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = checkLoggedIn();
  const socketRef = useRef(null);

  const autoGrid = Array.from({ length: 25 });

  useEffect(() => {
    if (isLoggedIn) {
      const minesSocket = getMinesSocket();
      if (minesSocket) {
        socketRef.current = minesSocket;
        minesSocket.on("game_history", (data) => {
          setHistory(data);
        });
        minesSocket.on("game_state", (gameState) => {
          if (gameState) {
            if (gameState.checkedOut) {
              // Cashout settled server-side: reflect the credit.
              requestWalletRefresh();
              setGameCheckout(true);
              setBetStarted(false);
              setSidebarDisabled(false);
              setShowGameOptions(false);
              setGrid(
                Array(25)
                  .fill()
                  .map(() => ({ type: "diamond", revealed: false }))
              );
              return;
            }

            if (gameState.message === "New game created") {
              // Bet placed: the stake was just debited.
              requestWalletRefresh();
            }

            if (gameState.grid) {
              setGrid(gameState.grid);
            }

            if (gameState.betAmount) {
              setBet(gameState.betAmount);
            }

            setGems(gameState.gems);
            setGameOver(gameState.gameOver);
            setGameWon(gameState.gameWon);
            setGameProfit(gameState.profit || 0);
            setGameLoss(gameState.loss || 0);

            if (gameState.hasActiveGame) {
              setHasActiveGame(true);
              setShowGameOptions(true);
              setSidebarDisabled(true);
            } else {
              setHasActiveGame(false);
              setShowGameOptions(false);
              setSidebarDisabled(false);
            }

            if (gameState.gameOver || gameState.gameWon) {
              setBetStarted(false);
              setSidebarDisabled(false);
            }
          }
        });

        minesSocket.on("game_over", ({ game }) => {
          // Bust: the stake stays debited, nothing was credited.
          requestWalletRefresh();
          setGameOver(true);
          setBetStarted(false);
          setSidebarDisabled(false);
        });

        minesSocket.on("game_won", ({ game }) => {
          // Full clear: the payout was credited server-side.
          requestWalletRefresh();
          setGameWon(true);
          setBetStarted(false);
          setSidebarDisabled(false);
        });

        minesSocket.on("error", (error) => {
          // Silently handle errors, but resync the balance readout in case
          // a bet was rejected. A rejected stake never started a round, so
          // unstick the bet panel for those errors specifically.
          requestWalletRefresh();
          const message = error?.message;
          if (
            message === "Insufficient balance" ||
            message === "Invalid bet amount"
          ) {
            toast.error(message);
            setBetStarted(false);
            setSidebarDisabled(false);
          }
        });

        if (minesSocket.connected) {
          setHasActiveGame(true);
        }
      }
    }

    return () => {
      // Only detach our listeners; don't tear down the shared socket on every
      // effect re-run, which disconnected it mid-handshake and dropped bets.
      const minesSocket = socketRef.current;
      if (minesSocket) {
        minesSocket.off("game_history");
        minesSocket.off("game_state");
        minesSocket.off("game_over");
        minesSocket.off("game_won");
        minesSocket.off("error");
      }
    };
  }, [isLoggedIn, setHistory]);

  useEffect(() => {
    // socket.io buffers emits until the connection is ready, so we only need
    // the socket to exist — gating on `.connected` here dropped bets placed
    // before the handshake finished.
    if (betStarted && socketRef.current) {
      setGrid(
        Array(25)
          .fill()
          .map(() => ({ type: "diamond", revealed: false }))
      );
      setGameOver(false);
      setGameWon(false);
      setGameProfit(0);
      setGameLoss(0);
      // Place the bet on the demo wallet; the server debits the stake once.
      addMinesGame(bet, mines, "demo");
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

    if (socketRef.current?.connected) {
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

    if (socketRef.current?.connected) {
      // Place the bet on the demo wallet; the server debits the stake once.
      addMinesGame(bet, mines, "demo");
      // Wait for game state to update after adding game
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
      if (socketRef.current?.connected) {
        socketRef.current.emit("checkout");
        // Wait for checkout to complete and game state to update
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Wait for game state to fully update before starting next game
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setTimeout(() => {
      autoBet(count - 1);
      setGrid(
        Array(25)
          .fill()
          .map(() => ({ type: "diamond", revealed: false }))
      );
    }, 2000);
  };

  useEffect(() => {
    if (gameOver || gameWon || gameCheckout) {
      if (socketRef.current?.connected) {
        socketRef.current.emit("checkout");
      }
    }
  }, [gameWon, gameOver, gameCheckout]);

  const handleContinueGame = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("continue_game");
      setBetStarted(true);
      setShowGameOptions(false);
      setSidebarDisabled(false);
    }
  };

  const handleCheckoutGame = async () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("checkout");
      setShowGameOptions(false);
      setSidebarDisabled(false);
      setBetStarted(false);
      setGameCheckout(true);
      setGrid(
        Array(25)
          .fill()
          .map(() => ({ type: "diamond", revealed: false }))
      );
    }
  };

  useEffect(() => {
    if (gameOver || gameWon) {
      setShowModal(true);
      const timer = setTimeout(() => {
        setShowModal(false);
        setGameOver(false);
        setGameWon(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameOver, gameWon]);

  useEffect(() => {
    if (gameCheckout) {
      setShowCheckoutModal(true);
      const timer = setTimeout(() => {
        setShowCheckoutModal(false);
        setGameCheckout(false);
        setGrid(
          Array(25)
            .fill()
            .map(() => ({ type: "diamond", revealed: false }))
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameCheckout]);

  const Modal = ({ title, image, game }) => (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center">
      <motion.div
        className="p-6 w-full max-w-md flex items-center flex-col rounded-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <img src={image} alt={title} className="w-32 sm:w-40 md:w-48 mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {title}
        </h2>
        {game && (
          <div className="text-center">
            <p
              className={`text-xl font-semibold mb-2 ${
                game.gameOver ? "text-red-500" : "text-green-500"
              }`}
            >
              {game.gameOver
                ? `Loss: ${game.loss || gameLoss}`
                : game.gameWon
                ? `Profit: ${game.profit || gameProfit}`
                : ""}
            </p>
            <p className="text-base text-gray-300">
              {game.gameOver
                ? "Better luck next time!"
                : game.gameWon
                ? "Congratulations!"
                : ""}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );

  const CheckoutModal = ({ profit }) => (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center">
      <motion.div
        className="p-6 w-full max-w-md flex items-center flex-col rounded-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <img
          src={diamond}
          alt="Checkout"
          className="w-32 sm:w-40 md:w-48 mb-4"
        />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Checkout
        </h2>
        <div className="text-center">
          <p className="text-xl font-semibold mb-2 text-green-500">
            Profit: {profit}
          </p>
          <p className="text-base text-gray-300">Great job!</p>
        </div>
      </motion.div>
    </div>
  );

  // Login Button Component
  const LoginButton = () => (
    <motion.button
      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-base"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate("?tab=login", { replace: true })}
    >
      Login to Play
    </motion.button>
  );

  // Game Options Modal Component
  const GameOptionsModal = () => (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">
          Active Game Found
        </h2>
        <p className="text-gray-300 text-lg mb-6">
          You have an active game in progress. Would you like to continue or
          checkout?
        </p>
        <div className="flex gap-4 justify-center">
          <motion.button
            className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinueGame}
          >
            Continue Game
          </motion.button>
          <motion.button
            className="px-6 py-3 text-lg bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCheckoutGame}
          >
            Checkout
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  // Not Logged In View
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-10 w-full relative">
        <h1 className="text-xl font-semibold text-white">User Not Logged In</h1>
        <p className="text-gray-400 text-lg text-center max-w-md">
          Please login to play the Mines game and start winning!
        </p>
        <LoginButton />
      </div>
    );
  }

  // Game Grid View
  return (
    <div className="flex flex-col items-center justify-center py-10 w-full relative">
      <div className="grid grid-cols-5 gap-2">
        {mode === "auto" &&
          (!selectBoxes ? (
            <>
              {autoGrid.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-24 h-24 max-lg:w-16 max-lg:h-16 ${
                    selectedBoxes.includes(index)
                      ? "bg-green-500"
                      : `${
                          selectedBoxes.length === 25 - mines
                            ? "bg-gray-950"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`
                  } rounded-lg flex items-center justify-center cursor-pointer`}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAutoGridClick(index)}
                ></motion.div>
              ))}
            </>
          ) : (
            <>
              {grid.map((box, index) => (
                <motion.div
                  key={index}
                  className={`w-24 h-24 max-lg:w-16 max-lg:h-16 ${
                    box.revealed
                      ? "bg-gray-950"
                      : selectedBoxes.includes(index)
                      ? "bg-gray-800"
                      : "bg-gray-700"
                  } rounded-lg flex items-center justify-center cursor-pointer`}
                  whileHover={!box.revealed ? { y: -5 } : {}}
                  whileTap={{ scale: 0.9 }}
                >
                  {box.revealed && (
                    <img
                      src={box.type === "diamond" ? diamond : bomb}
                      alt={box.type}
                      className="w-10 h-10"
                    />
                  )}
                </motion.div>
              ))}
            </>
          ))}

        {mode === "manual" && (
          <>
            {grid.map((box, index) => (
              <motion.div
                key={index}
                className={`w-24 h-24 max-lg:w-16 max-lg:h-16 ${
                  box.revealed ? "bg-gray-950" : "bg-gray-700 hover:bg-gray-600"
                } rounded-lg flex items-center justify-center cursor-pointer`}
                whileHover={!box.revealed ? { y: -5 } : {}}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleBoxClick(index)}
              >
                {box.revealed && (
                  <img
                    src={box.type === "diamond" ? diamond : bomb}
                    alt={box.type}
                    className="w-10 h-10"
                  />
                )}
              </motion.div>
            ))}
          </>
        )}
      </div>

      {showModal && (
        <>
          {gameOver && (
            <Modal
              title="Game Over"
              image={bomb}
              game={{ gameOver: true, loss: gameLoss }}
            />
          )}
          {gameWon && (
            <Modal
              title="You Won!"
              image={diamond}
              game={{ gameWon: true, profit: gameProfit }}
            />
          )}
        </>
      )}

      {showCheckoutModal && <CheckoutModal profit={gameProfit} />}
      {showGameOptions && <GameOptionsModal />}
    </div>
  );
};

export default Game;
