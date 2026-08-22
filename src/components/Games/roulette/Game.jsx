import { BettingBoard } from "./comp/BettingBoard";
import Roulette from "./comp/roulettewheel";
import { toast } from "react-toastify";
import {
  getRouletteSocket,
  initializeRouletteSocket,
  placeBet,
  subscribeBetResult,
  subscribeSocketError,
  subscribeGameJoined,
  joinGame,
} from "../../../socket/games/roulette";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useEffect, useState, useCallback, useRef } from "react";
import { ROULETTE_RED_NUMBERS } from "./roulette.constants";
import { fairnessFromBetResult } from "../../../utils/rouletteFairness";

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
  walletType = "demo",
  onRoundResult,
  setFairnessPrefill,
  chipBet,
}) {
  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const [spinPocket, setSpinPocket] = useState(null);
  const [spinKey, setSpinKey] = useState(0);
  const spinGenerationRef = useRef(0);

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

    const unsubBet = subscribeBetResult((result) => {
      console.log("[Roulette Game] Received bet result:", result);
      requestWalletRefresh();
      if (result.success) {
        const pocket = parseInt(result.result, 10);
        const fairness = fairnessFromBetResult(result);
        if (fairness) {
          setFairnessPrefill?.(fairness);
        }
        if (!Number.isNaN(pocket)) {
          spinGenerationRef.current += 1;
          setSpinKey(spinGenerationRef.current);
          setSpinPocket(pocket);
          setIsBettingEnabled(false);
          setBettingEnabledState?.(false);
          setIsSpinComplete(false);
        }

        setBettingStarted(false);
        setIsProcessing(false);
        setProcessingState?.(false);

        if (result.totalWin > 0) {
          toast.success(`You won ${result.totalWin}!`);
        }

        if (isAutoBetting && autoBetCountRef.current < nbets) {
          autoBetTimeoutRef.current = setTimeout(() => {
            if (isBettingEnabled && isSpinComplete) {
              autoBetCountRef.current += 1;
              setBettingStarted(true);
            }
          }, 11000);
        } else if (isAutoBetting) {
          setIsAutoBetting(false);
          setAutoBettingState?.(false);
          autoBetCountRef.current = 0;
          onAutoBetComplete?.();
        }
      } else {
        console.error("[Roulette Game] Bet result indicated failure:", result);
        toast.error(result.message || "Bet failed");
        setBettingStarted(false);
        setIsProcessing(false);
        setProcessingState?.(false);
        setIsBettingEnabled(true);
        setBettingEnabledState?.(true);
        setSpinPocket(null);
        if (isAutoBetting) {
          setIsAutoBetting(false);
          setAutoBettingState?.(false);
          autoBetCountRef.current = 0;
          clearTimeout(autoBetTimeoutRef.current);
          onAutoBetComplete?.();
        }
      }
    });

    const unsubError = subscribeSocketError((error) => {
      const message =
        typeof error === "string" ? error : error?.message || "Socket error";
      console.error("[Roulette Game] Socket error:", message);
      toast.error(message);
      requestWalletRefresh();
      setBettingStarted(false);
      setIsProcessing(false);
      setProcessingState?.(false);
      setIsBettingEnabled(true);
      setBettingEnabledState?.(true);
      setSpinPocket(null);
      if (isAutoBetting) {
        setIsAutoBetting(false);
        setAutoBettingState?.(false);
        autoBetCountRef.current = 0;
        clearTimeout(autoBetTimeoutRef.current);
        onAutoBetComplete?.();
      }
    });

    return () => {
      console.log("[Roulette Game] Cleaning up game socket handlers");
      unsubBet();
      unsubError();
      clearTimeout(autoBetTimeoutRef.current);
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
    setIsBettingEnabled,
    setIsSpinComplete,
    setFairnessPrefill,
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

      // Place the bet whenever at least one spot is selected, even if the
      // combined stake is 0 (testing). "No bets" still falls to the else.
      if (Object.keys(currentBets).length > 0) {
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
          walletType
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
    walletType,
  ]);

  const handlePlaceBet = useCallback(
    (number) => {
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

      const betAmount = chipBet;
      if (!Number.isFinite(betAmount) || betAmount <= 0) {
        toast.error("Select a chip value first");
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
      chipBet,
    ]
  );

  const handleBallLand = useCallback(
    (pocket) => {
      onRoundResult?.(pocket);
    },
    [onRoundResult]
  );

  const handleAnimationComplete = useCallback(() => {
    console.log("[Roulette Game] Wheel animation complete");
    setSpinPocket(null);
    setIsSpinComplete(true);
    setIsBettingEnabled(true);
    setBettingEnabledState?.(true);
    setIsProcessing(false);
    setProcessingState?.(false);
  }, [setBettingEnabledState, setProcessingState, setIsBettingEnabled, setIsSpinComplete]);

  const redNumbers = ROULETTE_RED_NUMBERS;

  return (
    <div className="roulette-game-root h-full w-full min-w-0 max-w-full overflow-x-hidden bg-gray-900 py-2 text-white max-lg:px-0 max-lg:py-1 lg:py-6">
      <div className="mx-auto flex w-full min-w-0 max-w-full flex-col items-center gap-2 max-lg:gap-0">
        <div className="roulette-wheel-scene flex justify-center w-full">
          <Roulette
            spinPocket={spinPocket}
            spinKey={spinKey}
            onBallLand={handleBallLand}
            onAnimationComplete={handleAnimationComplete}
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
