import { useEffect, useRef, useState } from "react";
import { balloonTypes, diamondTypes } from "./Frame";
import DiamondSlots from "./Slots";
import MobileSlot, { normalizeDiamondCounts } from "./MobileMainSlot";
import GridDiamond from "./GridDiamond";
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

const mergeServerGrid = (prev, serverGrid, poppedRef) =>
  serverGrid.map((serverBox, i) => {
    const local = prev[i];

    if (poppedRef.current.has(i)) {
      return {
        ...serverBox,
        revealed: true,
        animating: false,
        balloonColor: local?.balloonColor ?? serverBox.balloonColor,
      };
    }

    if (local?.animating || (serverBox.revealed && !local?.revealed)) {
      return {
        ...serverBox,
        revealed: false,
        animating: true,
        balloonColor: local?.balloonColor ?? serverBox.balloonColor,
      };
    }

    return {
      ...serverBox,
      animating: false,
      balloonColor: local?.balloonColor ?? serverBox.balloonColor,
    };
  });

const hydrateGridFromServer = (serverGrid, poppedRef) => {
  poppedRef.current = new Set(
    serverGrid.map((box, i) => (box.revealed ? i : null)).filter((i) => i != null)
  );
  return serverGrid.map((box) => ({
    ...box,
    revealed: Boolean(box.revealed),
    animating: false,
  }));
};

const BalloonPop = ({ color, popping, onPopComplete }) => (
  <div className="balloon-wrap">
    <div
      className={`balloon-inner${popping ? " is-popping" : ""}`}
      style={{ color }}
      onAnimationEnd={
        popping
          ? (event) => {
              if (event.animationName === "balloonBlast") {
                onPopComplete?.();
              }
            }
          : undefined
      }
    >
      <div className="balloon-body" style={{ backgroundColor: color }} />
      <div className="balloon-knot" style={{ borderTopColor: color }} />
      <div className="balloon-tail" />
    </div>
  </div>
);

const BalloonGrid = ({
  cells,
  interactive = false,
  onCellClick,
  onPopComplete,
  gridRef,
}) => (
    <div className="relative flex h-full w-full items-center justify-center px-1 py-1 max-lg:py-0 sm:px-2 lg:px-4 lg:py-4">
    <div
      ref={gridRef}
      className="balloon-grid mx-auto grid aspect-square w-full max-w-[min(100%,14rem)] grid-cols-3 grid-rows-3 gap-x-2.5 gap-y-2 sm:max-w-[min(100%,15rem)] sm:gap-x-3 sm:gap-y-2.5 lg:max-w-[min(100%,21rem)] lg:gap-x-4 lg:gap-y-3.5"
    >
      {cells.map((box, index) => (
        <div
          key={index}
          className={`balloon-cell${interactive ? " is-clickable" : ""}`}
          onClick={interactive ? () => onCellClick(index) : undefined}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={
            interactive
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onCellClick(index);
                  }
                }
              : undefined
          }
        >
          {(box.revealed || box.animating) && (
            <div className={`balloon-gem${box.animating ? " is-revealing" : ""}`}>
              <GridDiamond color={box.diamondColor} reveal={box.animating} />
            </div>
          )}
          {(!box.revealed || box.animating) && (
            <BalloonPop
              color={box.balloonColor}
              popping={box.animating}
              onPopComplete={() => onPopComplete(index)}
            />
          )}
        </div>
      ))}
    </div>
  </div>
);

const MobilePlayArea = ({
  diamondCounts,
  setslotindex,
  gridCells,
  interactive,
  onCellClick,
  onPopComplete,
}) => {
  const gridRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(0);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return undefined;

    const updateHeight = () => {
      setGridHeight(node.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [gridCells]);

  return (
    <div className="mobile-play-area flex w-full flex-row items-center justify-center gap-2.5">
      <MobileSlot
        diamondCounts={diamondCounts}
        setslotindex={setslotindex}
        gridHeight={gridHeight}
      />
      <div className="mobile-grid-wrap flex min-w-0 flex-1 items-center justify-center">
        <BalloonGrid
          gridRef={gridRef}
          cells={gridCells}
          interactive={interactive}
          onCellClick={onCellClick}
          onPopComplete={onPopComplete}
        />
      </div>
    </div>
  );
};

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
  onRoundComplete,
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
  const poppedRef = useRef(new Set());
  const completionTimerRef = useRef(null);

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
              setGrid(hydrateGridFromServer(game.grid, poppedRef));
              setDiamondCounts(normalizeDiamondCounts(game.diamondCounts));
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
          poppedRef.current = new Set();
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
          poppedRef.current = new Set();
          setGrid(
            game.grid.map((box) => ({
              ...box,
              revealed: false,
              animating: false,
            }))
          );
          setDiamondCounts(normalizeDiamondCounts(game.diamondCounts));
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
          setGrid((prev) => mergeServerGrid(prev, game.grid, poppedRef));
          setDiamondCounts(normalizeDiamondCounts(game.diamondCounts));
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
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
      }
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
      if (isNaN(betAmountNum) || betAmountNum < 0) {
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
    setGrid((prev) =>
      prev.map((box, i) => (i === index ? { ...box, animating: true } : box))
    );
    revealBox(activeGame._id, index);
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
    poppedRef.current.add(index);
    setGrid((prevGrid) =>
      prevGrid.map((box, i) =>
        i === index ? { ...box, animating: false, revealed: true } : box
      )
    );
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
    poppedRef.current = new Set();
    setDiamondCounts(
      diamondTypes.reduce(
        (acc, type) => ({ ...acc, [type]: { count: 0, indices: [] } }),
        {}
      )
    );
  };

  const resetToIdle = () => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    setShowCompletedGrid(false);
    setCompletedGameData(null);
    setBettingStarted(false);
    setActiveGame(null);
    setGameState("idle");
    setslotindex(null);
    handleReset();
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
      startAutoBetSequence(nbets);
    }
  }, [startAutoBet]);

  useEffect(() => {
    if (startAutoBet || !betStarted || !activeGame || gameState === "completed") {
      return;
    }

    const allRevealed =
      grid.length === 9 && grid.every((box) => box.revealed && !box.animating);

    if (!allRevealed) {
      return;
    }

    const fallbackTimer = setTimeout(() => {
      setBettingStarted(false);
      setActiveGame(null);
      setGameState("idle");
      handleReset();
    }, 4000);

    return () => clearTimeout(fallbackTimer);
  }, [grid, betStarted, activeGame, startAutoBet, gameState]);

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

    requestWalletRefresh();

    if (completedGame.winAmount > 0) {
      toast.success(`You won ${completedGame.winAmount}!`);
    } else {
      toast.info("Game completed!");
    }

    const displayGame = {
      ...completedGame,
      grid: completedGame.grid.map((box) => ({
        ...box,
        revealed: true,
        animating: false,
      })),
    };

    setCompletedGameData(displayGame);
    setShowCompletedGrid(true);
    setBettingStarted(false);
    setActiveGame(null);
    setGameState("completed");

    onRoundComplete?.({
      multiplier: Number(completedGame.multiplier) || 0,
      winAmount: completedGame.winAmount,
    });

    if (startAutoBet) {
      if (newGame) {
        setActiveGame(newGame);
        setGrid(hydrateGridFromServer(newGame.grid, poppedRef));
        setDiamondCounts(normalizeDiamondCounts(newGame.diamondCounts));
        setShowCompletedGrid(false);
        setCompletedGameData(null);
        setGameState("playing");
      }
      return;
    }

    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
    }

    completionTimerRef.current = setTimeout(() => {
      resetToIdle();
    }, 3000);
  };

  useEffect(() => {
    if (startAutoBet || !betStarted || gameState !== "completed" || !showCompletedGrid) {
      return;
    }

    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }

    setShowCompletedGrid(false);
    setCompletedGameData(null);
    setGameState("starting");
  }, [betStarted, gameState, startAutoBet, showCompletedGrid]);

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
      <div className="flex h-full w-full flex-col gap-1 px-3 pb-3 sm:px-4 max-lg:gap-0 lg:flex-row lg:gap-6 lg:pt-2">
        <div className="hidden shrink-0 lg:block lg:w-[54%]">
          <DiamondSlots
            diamondCounts={completedGameData.diamondCounts}
            setslotindex={setslotindex}
            slotindex={slotindex}
          />
        </div>
        <div className="flex min-h-[230px] flex-1 items-start justify-center max-lg:pt-4 lg:min-h-[440px] lg:items-center lg:pt-0 lg:w-[46%]">
          <div className="hidden h-full w-full lg:block">
            <BalloonGrid cells={completedGameData.grid} />
          </div>
          <div className="block w-full lg:hidden">
            <MobilePlayArea
              diamondCounts={completedGameData.diamondCounts}
              setslotindex={setslotindex}
              gridCells={completedGameData.grid}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-1 px-3 pb-3 sm:px-4 max-lg:gap-0 lg:flex-row lg:gap-6 lg:pt-2">
      <div className="hidden shrink-0 lg:block lg:w-[54%]">
        <DiamondSlots
          diamondCounts={diamondCounts}
          setslotindex={setslotindex}
          slotindex={slotindex}
        />
      </div>
      <div className="flex min-h-[230px] flex-1 items-start justify-center max-lg:pt-4 lg:min-h-[440px] lg:items-center lg:pt-0 lg:w-[46%]">
        <div className="hidden h-full w-full lg:block">
          <BalloonGrid
            cells={grid}
            interactive
            onCellClick={handleBoxClick}
            onPopComplete={handleAnimationComplete}
          />
        </div>
        <div className="block w-full lg:hidden">
          <MobilePlayArea
            diamondCounts={diamondCounts}
            setslotindex={setslotindex}
            gridCells={grid}
            interactive
            onCellClick={handleBoxClick}
            onPopComplete={handleAnimationComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default Game;
