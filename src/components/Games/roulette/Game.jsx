import { BettingBoard } from "./comp/BettingBoard";
import Roulette from "./comp/roulettewheel";
import { toast } from "react-toastify";
import {
  getRouletteSocket,
  placeBet,
  onBetResult,
  onGameResult,
  onError,
  removeAllListeners,
} from "../../../socket/games/roulette";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useEffect, useState, useCallback, useRef } from "react";

function Game({
  betStarted,
  setBettingStarted,
  currentBets,
  setCurrentBets,
  isSocketReady,
  isGameJoined,
  nbets,
  onAutoBetComplete,
  setProcessingState,
  isProcessing,
  setIsProcessing,
  setBettingEnabledState,
  isBettingEnabled,
  setIsBettingEnabled,
  setAutoBettingState,
  isSpinComplete,
  setIsSpinComplete,
}) {
  const [gameResult, setGameResult] = useState(null);

  const [isAutoBetting, setIsAutoBetting] = useState(false);

  const autoBetCountRef = useRef(0);
  const autoBetTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isSocketReady || !isGameJoined) {
      console.log(
        "[Roulette Game] Waiting for socket to be ready and game to be joined"
      );
      return;
    }

    console.log("[Roulette Game] Setting up socket event handlers");
    const socket = getRouletteSocket();
    if (!socket) {
      console.error("[Roulette Game] Socket not available");
      return;
    }

    onBetResult((result) => {
      console.log("[Roulette Game] Received bet result:", result);
      // Reflect the debit/credit in the in-game balance readout.
      requestWalletRefresh();
      if (result.success) {
        setGameResult(result);
        setBettingStarted(false);
        setIsProcessing(false);
        setProcessingState?.(false);
        setBettingEnabledState?.(true);

        if (result.totalWin > 0) {
          toast.success(`You won ${result.totalWin}!`);
        }

        // Handle auto-bet continuation
        if (isAutoBetting && autoBetCountRef.current < nbets) {
          autoBetTimeoutRef.current = setTimeout(() => {
            if (isBettingEnabled && isSpinComplete) {
              autoBetCountRef.current += 1;
              setBettingStarted(true);
            }
          }, 2000);
        } else if (isAutoBetting) {
          setIsAutoBetting(false);
          setAutoBettingState?.(false);
          autoBetCountRef.current = 0;
          if (onAutoBetComplete) {
            onAutoBetComplete();
          }
        }
      } else {
        console.error("[Roulette Game] Bet result indicated failure:", result);
        toast.error(result.message || "Bet failed");
        setBettingStarted(false);
        setIsProcessing(false);
        setProcessingState?.(false);
        setIsBettingEnabled(true);
        setBettingEnabledState?.(true);
        // Stop auto-bet on failure
        if (isAutoBetting) {
          setIsAutoBetting(false);
          setAutoBettingState?.(false);
          autoBetCountRef.current = 0;
          if (autoBetTimeoutRef.current) {
            clearTimeout(autoBetTimeoutRef.current);
          }
          if (onAutoBetComplete) {
            onAutoBetComplete();
          }
        }
      }
    });

    onGameResult((result) => {
      console.log("[Roulette Game] Received game result broadcast:", result);
      setIsBettingEnabled(false);
      setBettingEnabledState?.(false);
      setIsSpinComplete(false);
    });

    onError((error) => {
      console.error("[Roulette Game] Socket error:", error);
      toast.error(error);
      // A rejected bet (e.g. insufficient balance) left the wallet untouched;
      // resync the readout in case it drifted.
      requestWalletRefresh();
      setBettingStarted(false);
      setIsProcessing(false);
      setProcessingState?.(false);
      setIsBettingEnabled(true);
      setBettingEnabledState?.(true);
      // Stop auto-bet on error
      if (isAutoBetting) {
        setIsAutoBetting(false);
        setAutoBettingState?.(false);
        autoBetCountRef.current = 0;
        if (autoBetTimeoutRef.current) {
          clearTimeout(autoBetTimeoutRef.current);
        }
        if (onAutoBetComplete) {
          onAutoBetComplete();
        }
      }
    });

    return () => {
      console.log("[Roulette Game] Cleaning up socket event handlers");
      removeAllListeners();
      if (autoBetTimeoutRef.current) {
        clearTimeout(autoBetTimeoutRef.current);
      }
    };
  }, [
    isSocketReady,
    isGameJoined,
    setBettingStarted,
    isAutoBetting,
    nbets,
    isBettingEnabled,
    onAutoBetComplete,
    isSpinComplete,
    setProcessingState,
    setBettingEnabledState,
    setAutoBettingState,
  ]);

  useEffect(() => {
    if (!isSocketReady || !isGameJoined) {
      console.log(
        "[Roulette Game] Cannot place bet: Socket not ready or game not joined"
      );
      return;
    }

    if (betStarted && !isProcessing) {
      console.log("[Roulette Game] Processing bet:", {
        currentBets,
        isProcessing,
        isSocketReady,
        isGameJoined,
        isAutoBetting,
        autoBetCount: autoBetCountRef.current,
        socketId: getRouletteSocket()?.id,
      });

      const totalAmount = Object.values(currentBets).reduce(
        (sum, amount) => sum + parseFloat(amount),
        0
      );

      if (totalAmount > 0) {
        console.log("[Roulette Game] Placing bet:", {
          totalAmount,
          betTypes: Object.keys(currentBets),
          isAutoBetting,
          autoBetCount: autoBetCountRef.current,
          socketId: getRouletteSocket()?.id,
        });

        setIsProcessing(true);
        setProcessingState?.(true);
        setIsBettingEnabled(false);
        setBettingEnabledState?.(false);
        placeBet(
          currentBets,
          totalAmount,
          (result) => {
            console.log("[Roulette Game] Bet placement callback:", result);
            if (!result.success) {
              console.error(
                "[Roulette Game] Failed to place bet:",
                result.message
              );
              setIsProcessing(false);
              setProcessingState?.(false);
              setBettingStarted(false);
              setIsBettingEnabled(true);
              setBettingEnabledState?.(true);
              toast.error(
                result.message || "Failed to place bet. Please try again."
              );
            }
          },
          "demo"
        );
      } else {
        console.warn("[Roulette Game] No bets placed");
        toast.error("Please place a bet first");
        setBettingStarted(false);
        if (isAutoBetting) {
          setIsAutoBetting(false);
          autoBetCountRef.current = 0;
          if (onAutoBetComplete) {
            onAutoBetComplete();
          }
        }
      }
    }
  }, [
    betStarted,
    currentBets,
    setBettingStarted,
    isProcessing,
    isSocketReady,
    isGameJoined,
    isAutoBetting,
    onAutoBetComplete,
    setProcessingState,
    setBettingEnabledState,
  ]);

  const handlePlaceBet = useCallback(
    (number) => {
      if (!isSocketReady || !isGameJoined) {
        console.error(
          "[Roulette Game] Cannot place bet: Socket not ready or game not joined"
        );
        toast.error("Not connected to game. Please refresh the page.");
        return;
      }

      if (!isBettingEnabled) {
        console.warn("[Roulette Game] Betting is disabled during spin");
        return;
      }

      if (betStarted || isProcessing) {
        console.warn("[Roulette Game] Cannot place bet:", {
          reason: betStarted ? "bet in progress" : "processing result",
          number,
          socketId: getRouletteSocket()?.id,
        });
        return;
      }

      if (number === "clear") {
        if (!isBettingEnabled) {
          console.warn("[Roulette Game] Cannot clear bets during spin");
          return;
        }
        console.log("[Roulette Game] Clearing all bets");
        setCurrentBets({});
        setBettingStarted(false);
        setIsProcessing(false);
        return;
      }

      if (number === "auto_bet") {
        if (isAutoBetting) {
          console.warn("[Roulette Game] Auto-bet already in progress");
          return;
        }
        if (nbets <= 0) {
          toast.error("Please set a valid number of bets");
          return;
        }
        console.log("[Roulette Game] Starting auto-bet:", { nbets });
        setIsAutoBetting(true);
        setAutoBettingState?.(true);
        autoBetCountRef.current = 0;
        setBettingStarted(true);
        return;
      }

      const betAmount = parseFloat(localStorage.getItem("betAmount") || "0");
      if (betAmount <= 0) {
        console.warn("[Roulette Game] Invalid bet amount:", betAmount);
        toast.error("Please set a valid bet amount");
        return;
      }

      console.log("[Roulette Game] Placing bet:", {
        number,
        betAmount,
        currentBets,
        socketId: getRouletteSocket()?.id,
      });

      setCurrentBets((prev) => {
        const newBets = {
          ...prev,
          [number]: (parseFloat(prev[number]) || 0) + betAmount,
        };
        console.log("[Roulette Game] Updated bets:", {
          newBets,
          socketId: getRouletteSocket()?.id,
        });
        return newBets;
      });
    },
    [
      betStarted,
      isProcessing,
      isSocketReady,
      isGameJoined,
      setCurrentBets,
      setBettingStarted,
      isBettingEnabled,
      isAutoBetting,
      nbets,
      setAutoBettingState,
    ]
  );

  const handleAnimationComplete = useCallback(() => {
    console.log("[Roulette Game] Wheel animation complete");
    // setCurrentBets({});
    setIsProcessing(false);
    setIsBettingEnabled(true);
    setBettingEnabledState?.(true);
  }, [setCurrentBets, setBettingEnabledState]);

  const redNumbers = [
    32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3,
  ];

  return (
    <div className="text-white w-full py-8 max-h-[600px] relative">
      <div className="w-full mx-auto">
        <div className="flex scale-75 mt-[-50px] mb-[-10px] flex-col items-center">
          <Roulette
            redNumbers={redNumbers}
            betStarted={betStarted}
            setBettingStarted={setBettingStarted}
            gameResult={gameResult}
            onAnimationComplete={() => {
              setIsSpinComplete(true);
              setIsBettingEnabled(true);
              handleAnimationComplete();
            }}
          />
        </div>

        <BettingBoard
          red={redNumbers}
          onPlaceBet={handlePlaceBet}
          currentBets={currentBets}
          isProcessing={isProcessing || !isBettingEnabled || !isSpinComplete}
          isAutoBetting={isAutoBetting}
        />
      </div>
    </div>
  );
}

export default Game;
