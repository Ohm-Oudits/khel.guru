import { useEffect, useState, useRef } from "react";
import {
  getTowerSocket,
  disconnectTowerSocket,
  initializeTowerSocket,
  startTowerGame,
} from "../../../socket/games/tower";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useNavigate } from "react-router-dom";
import checkLoggedIn from "../../../utils/isloggedIn";

export default function Game({
  bettingStarted,
  Difficulty,
  setBettingStarted,
  startAutoBet,
  setStartAutoBet,
  autoSelectedBoxes,
  setSelectBoxes,
  setAutoSelectedBoxes,
  mode,
  nbets,
  autoArray,
  setAutoArray,
  rows,
  cols,
  setRows,
  setCols,
  setSidebarDisabled,
  bet,
  setBet,
}) {
  const [right, setRight] = useState(3);
  const [currentRow, setCurrentRow] = useState(null);
  const [rightIndices, setRightIndices] = useState([]);
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [emoji, setEmoji] = useState("/egg/easy.svg");
  const [bwEmoji, setBwEmoji] = useState("🍎");
  const [isConnected, setIsConnected] = useState(false);
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [showGameOptions, setShowGameOptions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = checkLoggedIn();
  const socketRef = useRef(null);
  const [profit, setProfit] = useState(0);
  const [loss, setLoss] = useState(0);
  const [checkedOut, setCheckedOut] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastSelectedBox, setLastSelectedBox] = useState(null);
  const [isCheckoutInProgress, setIsCheckoutInProgress] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showExistingGameModal, setShowExistingGameModal] = useState(false);

  const getRowColFromIndex = (index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return { row, col };
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (!socketRef.current) {
        const token = localStorage.getItem("token");
        initializeTowerSocket(token);
        socketRef.current = getTowerSocket();
      }

      const towerSocket = socketRef.current;

      if (towerSocket) {
        towerSocket.on("connect", () => {
          setIsConnected(true);
          setIsDisconnected(false);
          setShowDisconnectModal(false);
          towerSocket.emit("get_game_state");
        });

        towerSocket.on("disconnect", () => {
          setIsConnected(false);
          setIsDisconnected(true);
          setShowDisconnectModal(true);
        });

        towerSocket.on("game_state", (gameState) => {
          if (gameState) {
            if (gameState.existingGame) {
              setShowExistingGameModal(true);
              if (gameState.currentGame) {
                setRightIndices(gameState.currentGame.grid);
                setCurrentRow(gameState.currentGame.currentRow);
                setSelectedBoxes(gameState.currentGame.selectedBoxes || []);
              }
              return;
            }

            if (gameState.checkedOut) {
              // The cashout just settled: refresh the balance readout.
              requestWalletRefresh();
              setBettingStarted(false);
              setShowGameOptions(false);
              setShowCheckoutModal(true);
              setProfit(gameState.profit);
              setLoss(gameState.loss);
              if (gameState.grid) {
                setRightIndices(gameState.grid);
              }
              return;
            }

            if (gameState.grid) {
              setRightIndices(gameState.grid);
            }

            if (gameState.betAmount) {
              setBet(gameState.betAmount);
            }

            setGameOver(gameState.gameOver);
            setGameWon(gameState.gameWon);
            setCurrentRow(gameState.currentRow);
            setSelectedBoxes(gameState.selectedBoxes || []);

            // A new round debited the stake, a win credited the payout,
            // a loss kept the stake: refresh the balance readout.
            if (
              gameState.gameWon ||
              gameState.gameOver ||
              (gameState.hasActiveGame && !gameState.existingGame)
            ) {
              requestWalletRefresh();
            }

            if (gameState.hasActiveGame) {
              setHasActiveGame(true);
              setShowGameOptions(true);
            } else {
              setHasActiveGame(false);
              setShowGameOptions(false);
            }
          }
        });

        towerSocket.on("reveal", (result) => {
          console.log("Reveal result:", result);
          setIsAnimating(false);

          // A finished climb settles the round (win credited / loss kept).
          if (result.gameWon || !result.isCorrect) {
            requestWalletRefresh();
          }

          if (result.isCorrect) {
            setSelectedBoxes((prev) => [
              ...prev,
              { row: result.row, col: result.col, correct: true },
            ]);

            if (result.gameWon) {
              setGameWon(true);
              setProfit(result.profit);
              setShowCheckoutModal(true);
              setBettingStarted(false);
            } else {
              setCurrentRow(result.currentRow);
            }
          } else {
            setSelectedBoxes((prev) => [
              ...prev,
              { row: result.row, col: result.col, correct: false },
            ]);
            setGameOver(true);
            setLoss(result.loss);
            setShowGameOverModal(true);
            setBettingStarted(false);
          }

          if (result.grid) {
            setRightIndices(result.grid);
          }
        });

        towerSocket.on("checkout_result", (result) => {
          // The cashout just settled: refresh the balance readout.
          requestWalletRefresh();
          setProfit(result.profit);
          setShowCheckoutModal(true);
          setBettingStarted(false);
          setGameOver(false);
          setGameWon(false);
          setSelectedBoxes([]);
          setRightIndices([]);
        });

        towerSocket.on("error", ({ message }) => {
          console.error("Game error:", message);
          // A rejected action left the wallet untouched; resync the readout.
          requestWalletRefresh();
          toast.error(`Error: ${message}`);
        });

        if (towerSocket.connected) {
          setIsConnected(true);
          setSidebarDisabled(false);
        }

        towerSocket.off("reveal");
      }
    }

    return () => {
      const towerSocket = socketRef.current;
      if (towerSocket) {
        towerSocket.off("connect");
        towerSocket.off("disconnect");
        towerSocket.off("game_state");
        towerSocket.off("reveal");
        towerSocket.off("checkout_result");
        towerSocket.off("error");
      }
      disconnectTowerSocket();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (bettingStarted && socketRef.current?.connected) {
      setGameOver(false);
      setGameWon(false);
      setSelectedBoxes([]);
      setRightIndices([]);

      // Validate bet amount
      const betAmount = parseFloat(bet);
      if (isNaN(betAmount) || betAmount <= 0) {
        toast.error("Please enter a valid bet amount");
        setBettingStarted(false);
        return;
      }

      startTowerGame(betAmount, Difficulty, "demo");
    }
  }, [bettingStarted]);

  const handleBoxClick = (index) => {
    if (
      !bettingStarted ||
      !socketRef.current?.connected ||
      isAnimating ||
      isCheckoutInProgress ||
      checkedOut ||
      gameOver ||
      gameWon
    ) {
      return;
    }

    const { row, col } = getRowColFromIndex(index);
    console.log("Clicked box:", { row, col, currentRow });

    if (row !== currentRow) {
      return;
    }

    // Check if box is already selected
    const isAlreadySelected = selectedBoxes.some(
      (box) => box.row === row && box.col === col
    );
    if (isAlreadySelected) {
      return;
    }

    if (isAnimating) {
      return;
    }

    setSelectedBox(index);
    setIsAnimating(true);
    setLastSelectedBox(index);

    if (socketRef.current?.connected) {
      console.log("Emitting reveal event for index:", index);
      socketRef.current.emit("reveal", { index });
    }
  };

  const handleContinueGame = () => {
    if (socketRef.current?.connected) {
      console.log("Continuing game...");
      socketRef.current.emit("continue_game");
      setBettingStarted(true);
      setShowGameOptions(false);
      setShowExistingGameModal(false);
      setGameOver(false);
      setGameWon(false);
      setIsAnimating(false);
      setIsCheckoutInProgress(false);
      setCheckedOut(false);
    }
  };

  const handleCheckout = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("checkout");
      setShowExistingGameModal(false);
    }
  };

  useEffect(() => {
    setAutoArray(Array.from({ length: rows }, () => Array(cols).fill(0)));
    setAutoSelectedBoxes([]);
  }, [rows, cols]);

  const generateRightIndices = (rows, cols, right) => {
    const indices = [];
    for (let i = 0; i < rows; i++) {
      const rowIndices = new Set();
      while (rowIndices.size < right) {
        rowIndices.add(Math.floor(Math.random() * cols));
      }
      indices.push([...rowIndices]);
    }
    return indices;
  };

  const getBoxes = () => {
    if (Difficulty === "Easy") {
      setRows(9);
      setCols(4);
      setRight(3);
      setEmoji("/egg/easy.svg");
      setBwEmoji(" ");
    } else if (Difficulty === "Medium") {
      setRows(9);
      setCols(4);
      setRight(2);
      setEmoji("/egg/medium.svg");
      setBwEmoji("");
    } else if (Difficulty === "Hard") {
      setRows(9);
      setCols(2);
      setRight(1);
      setEmoji("/egg/hard.svg");
      setBwEmoji("");
    } else if (Difficulty === "Extreme") {
      setRows(9);
      setCols(3);
      setRight(1);
      setEmoji("/egg/extreme.svg");
      setBwEmoji("");
    } else if (Difficulty === "Nightmare") {
      setRows(9);
      setCols(4);
      setRight(1);
      setEmoji("/egg/nightmare.svg");
      setBwEmoji("");
    }
  };

  useEffect(() => {
    setSelectedBoxes([]);
    setRightIndices([]);
    getBoxes();
  }, [Difficulty]);

  const getBoxContent = (rowIndex, colIndex) => {
    const selectedBox = selectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    if (selectedBox) {
      return selectedBox.correct ? (
        <img className="h-10" src={emoji} alt="egg" />
      ) : (
        ""
      );
    }

    if (showResult && rightIndices[rowIndex]?.includes(colIndex)) {
      return <img className="h-10" src={emoji} alt="egg" />;
    }

    return bwEmoji;
  };

  const getBoxColor = (rowIndex, colIndex) => {
    const selected = selectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    if (selected) {
      return selected.correct
        ? "bg-[#1a2c38] border-2 bg-opacity-1 border-[#56687A]"
        : "!bg-red-500 bg-opacity-75";
    }

    // Highlight current row
    if (rowIndex === currentRow && bettingStarted && !gameOver && !gameWon) {
      return "bg-yellow-400 bg-opacity-25 hover:bg-yellow-400 hover:bg-opacity-40";
    }

    return "bg-[#213743]";
  };

  const getbg = (rowIndex, colIndex) => {
    const selected = selectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    return selected
      ? ""
      : "after:bg-[linear-gradient(25deg,transparent_48%,rgba(255,255,255,0.1)_50%,transparent_52%),linear-gradient(-45deg,transparent_48%,rgba(255,255,255,0.1)_50%,transparent_52%)]";
  };

  const getAutoBoxColor = (rowIndex) => {
    const firstZeroRow = autoArray.findLastIndex((row) =>
      row.every((cell) => cell === 0)
    );

    if (rowIndex === firstZeroRow) {
      return "bg-yellow-500";
    }

    return "";
  };

  const getAutobg = (rowIndex, colIndex) => {
    const selected = autoSelectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    return selected
      ? "bg-black border-2 border-[#56687A] bg-opacity-10"
      : "bg-[#213743] border-1";
  };

  const getIsTrue = (rowIndex, colIndex) => {
    const selected = selectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    return selected ? "bg-green-500" : "";
  };

  const handleAutoClick = (rowIndex, colIndex) => {
    const lastZeroRow = autoArray.findLastIndex((row) =>
      row.every((cell) => cell === 0)
    );

    if (rowIndex !== lastZeroRow) {
      return;
    }

    setAutoSelectedBoxes((prev) => [...prev, { row: rowIndex, col: colIndex }]);
    setAutoArray((prev) =>
      prev.map((row, rIndex) =>
        rIndex === rowIndex
          ? row.map((cell, cIndex) => (cIndex === colIndex ? 1 : cell))
          : row
      )
    );
  };

  useEffect(() => {
    if (startAutoBet && nbets > 0) {
      autoBet(nbets);
    }
  }, [startAutoBet]);

  const autoBet = async (remaining) => {
    if (remaining <= 0) {
      setStartAutoBet(false);
      return;
    }

    const towerSocket = getTowerSocket();
    if (towerSocket) {
      startTowerGame(parseFloat(bet), Difficulty, "demo");
      console.log("Emitted add_game event");
    } else {
      console.error("Tower socket not initialized");
      toast.error("Failed to join game: Socket not connected");
      return;
    }
    setCurrentRow(rows - 1);
    const indices = generateRightIndices(rows, cols, right);
    setRightIndices(indices);
    setShowResult(false);
    await new Promise((resolve) => setTimeout(resolve, 500));

    for (let i = 0; i < autoSelectedBoxes.length; i++) {
      const { row, col } = autoSelectedBoxes[i];

      const end = handleBoxClick(row * cols + col);

      if (end) {
        setShowResult(true);
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setShowResult(true);
    setTimeout(() => {
      setGameOver(false);
      setGameWon(false);
      setSelectedBoxes([]);
      setRightIndices([]);
      autoBet(remaining - 1);
    }, 2000);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <img src="/tower.gif" className="-mb-14" alt="Tower Animation" />{" "}
      <div className="bg-[#56687A] rounded-2xl lg:w-[60%] w-[90%] mb-5 p-2">
        <div className="bg-[#1a2c38] w-[100%] h-full p-1 rounded grid place-items-center">
          <div className="w-[98%]">
            <>
              {mode === "auto" ? (
                <>
                  {startAutoBet ? (
                    <>
                      {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div
                          key={`row-${rowIndex}`}
                          className="flex justify-between "
                        >
                          {Array.from({ length: cols }).map((_, colIndex) => (
                            <div
                              key={`col-${colIndex}`}
                              className={`w-full h-11 cursor-pointer ${getBoxColor(
                                rowIndex,
                                colIndex
                              )} m-1 rounded-lg transition-colors duration-300 flex items-center justify-center relative overflow-hidden before:absolute before:content-[''] before:inset-0 before:opacity-10 before:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0),linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.1)_75%),linear-gradient(-45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.1)_75%)] before:bg-[size:10px_10px,20px_20px,20px_20px] before:animate-[shimmer_3s_linear_infinite] before:pointer-events-none after:absolute after:content-[''] after:inset-0  ${getbg(
                                rowIndex,
                                colIndex
                              )} ${getAutobg(rowIndex, colIndex)} ${
                                startAutoBet && getIsTrue(rowIndex, colIndex)
                              } after:bg-[size:30px_30px]`}
                            >
                              {getBoxContent(rowIndex, colIndex)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {autoArray.map((colArray, rowIndex) => (
                        <div
                          key={`row-${rowIndex}`}
                          className="flex justify-between"
                        >
                          {colArray.map((_, colIndex) => (
                            <div
                              key={`col-${colIndex}`}
                              onClick={() =>
                                handleAutoClick(rowIndex, colIndex)
                              }
                              className={`w-full h-11 cursor-pointer ${getAutoBoxColor(
                                rowIndex,
                                colIndex
                              )} m-1 rounded-lg transition-colors duration-300 flex items-center justify-center relative overflow-hidden before:absolute before:content-[''] before:inset-0 before:opacity-10 before:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0),linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.1)_75%),linear-gradient(-45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.1)_75%)] before:bg-[size:10px_10px,20px_20px,20px_20px] before:animate-[shimmer_3s_linear_infinite] before:pointer-events-none after:absolute after:content-[''] after:inset-0  ${getAutobg(
                                rowIndex,
                                colIndex
                              )} after:bg-[size:30px_30px]`}
                            ></div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                      key={`row-${rowIndex}`}
                      className="flex justify-between "
                    >
                      {Array.from({ length: cols }).map((_, colIndex) => (
                        <div
                          key={`col-${colIndex}`}
                          onClick={() =>
                            handleBoxClick(rowIndex * cols + colIndex)
                          }
                          className={`w-full h-11 cursor-pointer ${getBoxColor(
                            rowIndex,
                            colIndex
                          )} m-1 rounded-lg transition-colors duration-300 flex items-center justify-center relative overflow-hidden before:absolute before:content-[''] before:inset-0 before:opacity-10 before:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0),linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.1)_75%),linear-gradient(-45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.1)_75%)] before:bg-[size:10px_10px,20px_20px,20px_20px] before:animate-[shimmer_3s_linear_infinite] before:pointer-events-none after:absolute after:content-[''] after:inset-0  ${getbg(
                            rowIndex,
                            colIndex
                          )} after:bg-[size:30px_30px]`}
                        >
                          {getBoxContent(rowIndex, colIndex)}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </>
          </div>
        </div>
      </div>
      {showDisconnectModal && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              {isDisconnected ? "Disconnected from Game" : "Session Expired"}
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              {isDisconnected
                ? "You have been disconnected from the game server. Would you like to reconnect?"
                : "Your session has expired. Please login again to continue playing."}
            </p>
            <div className="flex gap-4 justify-center">
              {isDisconnected ? (
                <button
                  className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (token) {
                      initializeTowerSocket(token);
                      socketRef.current = getTowerSocket();
                    }
                  }}
                >
                  Reconnect
                </button>
              ) : (
                <button
                  className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                  onClick={() => navigate("?tab=login", { replace: true })}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showGameOverModal && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Game Over</h2>
            <div className="text-gray-300 text-lg mb-6">
              <p className="mb-2">Your loss:</p>
              <p className="text-2xl font-bold text-red-500">
                {loss.toFixed(8)} BTC
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                onClick={() => {
                  setShowGameOverModal(false);
                  setBettingStarted(false);
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
      {showCheckoutModal && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              {gameWon ? "Congratulations!" : "Checkout Complete"}
            </h2>
            <div className="text-gray-300 text-lg mb-6">
              <p className="mb-2">Your {gameWon ? "profit" : "result"}:</p>
              <p
                className={`text-2xl font-bold ${
                  gameWon
                    ? "text-green-500"
                    : profit > 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {profit.toFixed(8)} BTC
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                onClick={() => {
                  setShowCheckoutModal(false);
                  setBettingStarted(false);
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
      {showExistingGameModal && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              Active Game Found
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              You have an active game. Would you like to continue or checkout?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                onClick={handleContinueGame}
              >
                Continue Game
              </button>
              <button
                className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                onClick={handleCheckout}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
