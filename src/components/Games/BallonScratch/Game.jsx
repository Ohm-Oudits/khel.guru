import { useEffect, useState } from "react";
import { balloonTypes, diamondTypes } from "./Frame";
import DiamondSlots from "./Slots";
import MobileSlot from "./MobileMainSlot";
import "../../../styles/Scratch.css";
import {
  disconnectScratchSocket,
  getScratchSocket,
  getActiveGame,
  startGame,
  revealBox,
  onGameStarted,
  onBoxRevealed,
  onGameCompleted,
  onError,
  removeAllGameListeners,
} from "../../../socket/games/scratch";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";

const Game = ({
  betStarted,
  setBettingStarted,
  diamondCounts,
  setDiamondCounts,
  AutoClick,
  setAutoPick,
  slotindex,
  setslotindex,
  startAutoBet,
  setStartAutoBet,
  nbets,
  betAmount,
}) => {
  const [grid, setGrid] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [gameState, setGameState] = useState("idle");
  const [showCompletedGrid, setShowCompletedGrid] = useState(false);
  const [completedGameData, setCompletedGameData] = useState(null);
  const [autoRevealInProgress, setAutoRevealInProgress] = useState(false);
  const [remainingAutoBets, setRemainingAutoBets] = useState(0);

  useEffect(() => {
    console.log("🎮 Game State Update:", {
      gameState,
      betStarted,
      loading,
      activeGame: activeGame
        ? {
            id: activeGame._id,
            betAmount: activeGame.betAmount,
            isAutoBet: activeGame.isAutoBet,
            remainingBets: activeGame.remainingBets,
            revealedBoxes: activeGame.grid.filter((box) => box.revealed).length,
          }
        : null,
      gridLength: grid.length,
      socketConnected,
    });
  }, [gameState, betStarted, loading, activeGame, grid, socketConnected]);

  useEffect(() => {
    const initializeSocket = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("⚠️ No token found");
        return;
      }

      try {
        const socket = getScratchSocket();
        if (!socket) {
          console.log("⚠️ Socket not initialized");
          return;
        }

        socket.on("connect", () => {
          console.log("🔌 Socket connected");
          setSocketConnected(true);
          setSocketInitialized(true);

          getActiveGame(({ game, error }) => {
            console.log(
              "📥 Received active game:",
              game ? "Found" : "Not found",
              error
            );
            if (game) {
              console.log("🎮 Loading existing game:", {
                gameId: game._id,
                revealedBoxes: game.grid.filter((box) => box.revealed).length,
                totalBoxes: game.grid.length,
              });
              setActiveGame(game);
              setGrid(game.grid);
              setDiamondCounts(game.diamondCounts);
              setBettingStarted(true);
              setGameState("playing");
            }
          });
        });

        socket.on("disconnect", () => {
          console.log("🔌 Socket disconnected");
          setSocketConnected(false);
          setSocketInitialized(false);
          setGameState("idle");

          setBettingStarted(false);
          setActiveGame(null);
          setGrid([]);
          setDiamondCounts(
            diamondTypes.reduce(
              (acc, type) => ({ ...acc, [type]: { count: 0, indices: [] } }),
              {}
            )
          );
        });

        onGameStarted(({ game }) => {
          console.log("🎮 Game started:", {
            gameId: game._id,
            betAmount: game.betAmount,
            isAutoBet: game.isAutoBet,
            grid: game.grid,
          });
          // The stake was just debited: refresh the balance readout.
          requestWalletRefresh();
          setActiveGame(game);
          setGrid(game.grid);
          setDiamondCounts(game.diamondCounts);
          setBettingStarted(true);
          setGameState("playing");
          setLoading(false);
        });

        onBoxRevealed(({ game }) => {
          console.log("🎯 Box revealed:", {
            gameId: game._id,
            revealedBoxes: game.grid.filter((box) => box.revealed).length,
            totalBoxes: game.grid.length,
          });
          setGrid(game.grid);
          setDiamondCounts(game.diamondCounts);

          const allRevealed = game.grid.every((box) => box.revealed);
          if (allRevealed) {
            setGameState("completed");
          }
        });

        onGameCompleted(({ completedGame, newGame }) => {
          handleGameCompletion(completedGame, newGame);
        });

        onError(({ message }) => {
          console.error("❌ Game error:", message);
          toast.error(message);
          // A rejected bet left the wallet untouched; resync the readout.
          requestWalletRefresh();
          setLoading(false);
          setBettingStarted(false);
          setGameState("idle");
        });
      } catch (error) {
        console.error("❌ Socket initialization error:", error);
        setSocketConnected(false);
        setSocketInitialized(false);
        setGameState("idle");
      }
    };

    initializeSocket();

    return () => {
      console.log("🧹 Cleaning up game component");
      removeAllGameListeners();
    };
  }, []);

  useEffect(() => {
    if (
      betStarted &&
      !activeGame &&
      socketConnected &&
      socketInitialized &&
      !startAutoBet
    ) {
      const betAmountNum = parseFloat(betAmount);
      if (isNaN(betAmountNum) || betAmountNum <= 0) {
        console.log("⚠️ Invalid bet amount:", betAmount);
        toast.error("Please enter a valid bet amount");
        setBettingStarted(false);
        setGameState("idle");
        return;
      }

      console.log("🎮 Attempting to start game:", {
        betAmount: betAmountNum,
        isAutoBet: startAutoBet,
        numberOfBets: nbets,
        socketConnected,
        socketInitialized,
        socket: getScratchSocket()?.connected ? "connected" : "disconnected",
      });

      if (!socketConnected) {
        console.log("⚠️ Cannot start game: Socket not connected");
        toast.error("Cannot start game: Not connected to server");
        setBettingStarted(false);
        return;
      }

      const socket = getScratchSocket();
      if (!socket || !socket.connected) {
        console.log("⚠️ Socket not available or disconnected");
        toast.error("Connection lost. Please refresh the page.");
        setBettingStarted(false);
        setGameState("idle");
        return;
      }

      setGameState("starting");
      setLoading(true);

      console.log("📤 Emitting start_game event:", {
        betAmount: betAmountNum,
        isAutoBet: startAutoBet,
        numberOfBets: startAutoBet ? parseInt(nbets) : 0,
      });

      startGame(
        betAmountNum,
        startAutoBet,
        nbets,
        (response) => {
          console.log("📥 Game start response:", response);
          if (response.error) {
            console.error("❌ Game start error:", response.error);
            toast.error(response.error);
            setLoading(false);
            setBettingStarted(false);
            setGameState("idle");
          } else {
            console.log("✅ Game start successful:", response);
          }
        },
        "demo"
      );

      const errorHandler = ({ message }) => {
        console.error("❌ Game start error:", message);
        toast.error(message);
        // A rejected bet left the wallet untouched; resync the readout.
        requestWalletRefresh();
        setLoading(false);
        setBettingStarted(false);
        setGameState("idle");

        if (socket) {
          socket.off("error", errorHandler);
        }
      };

      if (socket) {
        socket.on("error", errorHandler);
      }
    }
  }, [
    betStarted,
    activeGame,
    betAmount,
    startAutoBet,
    nbets,
    socketConnected,
    socketInitialized,
  ]);

  useEffect(() => {
    const socket = getScratchSocket();
    if (socket) {
      const logConnectionStatus = () => {
        console.log("🔌 Socket status:", {
          connected: socket.connected,
          id: socket.id,
          hasListeners: {
            game_started: socket.hasListeners("game_started"),
            error: socket.hasListeners("error"),
            box_revealed: socket.hasListeners("box_revealed"),
            game_completed: socket.hasListeners("game_completed"),
          },
        });
      };

      socket.on("connect", () => {
        console.log("🔌 Socket connected with ID:", socket.id);
        logConnectionStatus();
      });

      socket.on("disconnect", () => {
        console.log("🔌 Socket disconnected");
        logConnectionStatus();
      });

      logConnectionStatus();
    }
  }, []);

  const handleBoxClick = (index) => {
    if (!betStarted || !activeGame) {
      console.log("⚠️ Cannot reveal box:", {
        betStarted,
        hasActiveGame: !!activeGame,
      });
      return;
    }

    const clickedBox = grid[index];
    if (clickedBox.revealed || clickedBox.diamondColor === null) {
      console.log("⚠️ Box already revealed or invalid:", {
        index,
        revealed: clickedBox.revealed,
      });
      return;
    }

    console.log("🎯 Revealing box:", {
      gameId: activeGame._id,
      boxIndex: index,
    });
    revealBox(activeGame._id, index);
  };

  const getimage = (color) => {
    if (color == "red") {
      return (
        <div className="gemWrapper">
          <div className="gemBox ruby">
            <div className="shine"></div>
          </div>
          <div className="glint"></div>
        </div>
      );
    } else if (color == "yellow") {
      return (
        <div className="gemWrapper">
          <div className="gemBox topaz">
            <div className="shine"></div>
          </div>
          <div className="glint"></div>
        </div>
      );
    } else if (color == "blue") {
      return (
        <div className="gemWrapper">
          <div className="gemBox sapphire">
            <div className="shine"></div>
          </div>
          <div className="glint"></div>
        </div>
      );
    } else if (color == "purple") {
      return (
        <div className="gemWrapper">
          <div className="gemBox alexandrite">
            <div className="shine"></div>
          </div>
          <div className="glint"></div>
        </div>
      );
    } else
      return (
        <div className="gemWrapper">
          <div className="gemBox diamond">
            <div className="shine"></div>
          </div>
          <div className="glint"></div>
        </div>
      );
  };

  const handleAutoClick = () => {
    setGrid((prevGrid) => {
      const updatedGrid = prevGrid.map((box, index) => {
        if (!box.revealed && !box.animating) {
          if (box.diamondColor) {
            setDiamondCounts((prevCounts) => ({
              ...prevCounts,
              [box.diamondColor]: {
                count: prevCounts[box.diamondColor].count + 1,
                indices: [...prevCounts[box.diamondColor].indices, index],
              },
            }));
          }
          return { ...box, animating: false, revealed: true };
        }
        return box;
      });
      return updatedGrid;
    });
  };

  const handleAnimationComplete = (index) => {
    setGrid((prevGrid) =>
      prevGrid.map((box, i) =>
        i === index ? { ...box, animating: false, revealed: true } : box
      )
    );

    const clickedBox = grid[index];
    if (clickedBox && clickedBox.diamond) {
      setDiamondCounts((prevCounts) => ({
        ...prevCounts,
        [clickedBox.diamond]: {
          count: prevCounts[clickedBox.diamond].count + 1,
          indices: [...prevCounts[clickedBox.diamond].indices, index],
        },
      }));
    }
  };

  const handleReset = () => {
    const createGrid = () => {
      return Array.from({ length: 9 }, () => {
        const balloonColor =
          balloonTypes[Math.floor(Math.random() * balloonTypes.length)];
        const diamondColor =
          diamondTypes[Math.floor(Math.random() * diamondTypes.length)];
        return {
          revealed: false,
          animating: false,
          balloonColor,
          diamondColor,
        };
      });
    };

    setGrid(createGrid());
    setDiamondCounts(
      diamondTypes.reduce(
        (acc, type) => ({ ...acc, [type]: { count: 0, indices: [] } }),
        {}
      )
    );
  };

  useEffect(() => {
    if (AutoClick) {
      handleAutoClick();
      setTimeout(() => {
        setAutoPick(false);
      }, 4000);
    }
  }, [AutoClick]);

  useEffect(() => {
    handleReset();
  }, []);

  useEffect(() => {
    if (startAutoBet) {
      return;
    }

    if (grid.length === 9 && grid.every((box) => box.revealed)) {
      setTimeout(() => {
        setBettingStarted(false);
        handleReset();
      }, 1500);
    }
  }, [grid]);

  useEffect(() => {
    if (startAutoBet) {
      startAutoBetSequence(nbets);
    }
  }, [startAutoBet]);

  const autoRevealBoxes = async (gameId, grid) => {
    if (!gameId || !grid || autoRevealInProgress) return;

    setAutoRevealInProgress(true);
    console.log("🎯 Starting auto reveal for game:", gameId);

    const unrevealedBoxes = grid
      .map((box, index) => ({ ...box, index }))
      .filter((box) => !box.revealed);

    for (const box of unrevealedBoxes) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      revealBox(gameId, box.index);
    }

    setAutoRevealInProgress(false);
  };

  const startAutoBetSequence = async (initialBets) => {
    if (initialBets <= 0) {
      console.log("🎮 Auto bet sequence complete");
      setStartAutoBet(false);
      return;
    }

    setRemainingAutoBets(initialBets);
    console.log("🎮 Starting auto bet sequence with", initialBets, "bets");

    const runAutoBetGame = async () => {
      if (remainingAutoBets <= 0) {
        setStartAutoBet(false);
        return;
      }

      setGameState("starting");
      setLoading(true);

      startGame(
        betAmount,
        true,
        remainingAutoBets,
        async (response) => {
          if (response.error) {
            console.error("❌ Auto bet game error:", response.error);
            toast.error(response.error);
            setStartAutoBet(false);
            setLoading(false);
            return;
          }

          console.log("✅ Auto bet game started:", response);
          setLoading(false);

          await new Promise((resolve) => setTimeout(resolve, 500));

          if (response.game) {
            await autoRevealBoxes(response.game._id, response.game.grid);
          }

          await new Promise((resolve) => setTimeout(resolve, 4000));

          setRemainingAutoBets((prev) => prev - 1);
          if (remainingAutoBets > 1) {
            runAutoBetGame();
          } else {
            setStartAutoBet(false);
          }
        },
        "demo"
      );
    };

    runAutoBetGame();
  };

  const handleGameCompletion = (completedGame, newGame) => {
    console.log("🏁 Game completed:", {
      gameId: completedGame._id,
      winAmount: completedGame.winAmount,
      multiplier: completedGame.multiplier,
      hasNewGame: !!newGame,
      remainingBets: remainingAutoBets,
    });

    // The round just settled (win credited / loss kept): refresh the balance.
    requestWalletRefresh();

    if (completedGame.winAmount > 0) {
      toast.success(`You won ${completedGame.winAmount}!`);
    } else {
      toast.info("Game completed!");
    }

    setCompletedGameData(completedGame);
    setShowCompletedGrid(true);
    setGameState("completed");

    if (!startAutoBet) {
      const minDisplayTime = 5000;
      const startTime = Date.now();

      const handleNextGame = () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

        setTimeout(() => {
          setShowCompletedGrid(false);
          setCompletedGameData(null);
          setBettingStarted(false);
          setActiveGame(null);
          setGrid([]);
          setDiamondCounts(
            diamondTypes.reduce(
              (acc, type) => ({ ...acc, [type]: { count: 0, indices: [] } }),
              {}
            )
          );
          setGameState("idle");
        }, remainingTime);
      };

      handleNextGame();
    }
  };

  useEffect(() => {
    const socket = getScratchSocket();
    if (socket) {
      onGameCompleted(({ completedGame, newGame }) => {
        handleGameCompletion(completedGame, newGame);
      });
    }
  }, [startAutoBet]);

  useEffect(() => {
    if (betStarted && gameState === "completed" && !startAutoBet) {
      setShowCompletedGrid(false);
      setCompletedGameData(null);
      setGameState("starting");
    }
  }, [betStarted, gameState, startAutoBet]);

  if (loading) {
    console.log("⏳ Showing loading state", {
      gameState,
      socketConnected,
      socketInitialized,
      hasActiveGame: !!activeGame,
      betStarted,
    });
    return (
      <div className="w-full h-full flex items-center justify-center absolute inset-0 bg-gray-900 bg-opacity-90 z-50">
        <div className="text-white text-2xl font-semibold">
          {gameState === "starting"
            ? "Starting game..."
            : !socketConnected
            ? "Connecting to game server..."
            : !socketInitialized
            ? "Initializing game..."
            : "Loading game..."}
        </div>
      </div>
    );
  }

  if (showCompletedGrid && completedGameData) {
    return (
      <div className="w-full h-full p-1 grid lg:flex">
        <div className="block lg:hidden">
          <MobileSlot
            diamondCounts={completedGameData.diamondCounts}
            slotindex={slotindex}
          />
        </div>
        <div className="hidden lg:block lg:w-4/7 items-center h-[400px] justify-center">
          <DiamondSlots
            diamondCounts={completedGameData.diamondCounts}
            setslotindex={setslotindex}
            slotindex={slotindex}
          />
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center sm:py-10">
          <div className="flex flex-col items-bottom space-y-4">
            <div className="grid grid-cols-3 lg:w-30 lg:h-20 gap-14 lg:gap-5 py-[50px] lg:py-[1px] md:py[1px] sm:py-[10px]">
              {completedGameData.grid.map((box, index) => (
                <div
                  key={index}
                  className="relative scale-150 lg:scale-100 lg:w-20 lg:h-20 bg-gray-700 rounded-lg flex justify-center shadow-lg"
                >
                  <div className="absolute empty justify-between">
                    {getimage(box.diamondColor)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-1 grid lg:flex">
      <div className="block lg:hidden">
        <MobileSlot diamondCounts={diamondCounts} slotindex={slotindex} />
      </div>
      <div className="hidden lg:block lg:w-4/7 items-center h-[400px] justify-center">
        <DiamondSlots
          diamondCounts={diamondCounts}
          setslotindex={setslotindex}
          slotindex={slotindex}
        />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center sm:py-10">
        <div className="flex flex-col items-bottom space-y-4">
          <div className="grid grid-cols-3 lg:w-30 lg:h-20 gap-14 lg:gap-5 py-[50px] lg:py-[1px] md:py[1px] sm:py-[10px]">
            {grid.map((box, index) => (
              <div
                key={index}
                className="relative scale-150 lg:scale-100 lg:w-20 lg:h-20 bg-gray-700 rounded-lg flex justify-center shadow-lg"
                onClick={() => handleBoxClick(index)}
              >
                {!box.revealed && (
                  <div
                    className={`absolute balloon ${
                      box.animating ? "animate-float" : ""
                    }`}
                    style={{ backgroundColor: box.balloonColor }}
                    onAnimationEnd={() => handleAnimationComplete(index)}
                  ></div>
                )}
                {box.revealed && (
                  <div className="absolute empty justify-between">
                    {getimage(box.diamondColor)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
