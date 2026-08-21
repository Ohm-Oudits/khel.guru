import { useState, useEffect, useRef, useCallback } from "react";
import "../../../styles/Frame.css";
import FairnessModal from "../../Frame/FairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";
import History from "../../Frame/History";
import {
  getRoulettePocketColor,
  ROULETTE_DEFAULT_CHIP,
} from "./roulette.constants";
import { useNavigate } from "react-router-dom";
import {
  getRouletteSocket,
  initializeRouletteSocket,
  joinGame,
  subscribeGameJoined,
  subscribeSocketError,
} from "../../../socket/games/roulette";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useActiveWalletType } from "../../../hooks/useGameBalance";

const ROULETTE_HISTORY_KEY = "roulette_game_history";
const ROULETTE_CHIP_KEY = "roulette_selected_chip";
const MAX_HISTORY_ITEMS = 50;

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNbets] = useState(0);
  const [onWin, setOnWin] = useState(0);
  const [onLoss, setOnLoss] = useState(0);
  const [onWinReset, setOnWinReset] = useState(false);
  const [onLossReset, setOnLossReset] = useState(false);
  const [Difficulty, setDifficulty] = useState("Easy");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");
  const [betStarted, setBettingStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalProfit, setTotalProfit] = useState("0.000000");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBettingEnabled, setIsBettingEnabled] = useState(true);
  const [isSpinComplete, setIsSpinComplete] = useState(true);
  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const [isWheelAnimationComplete, setIsWheelAnimationComplete] =
    useState(true);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const [isFairness, setIsFairness] = useState(false);
  const [isGameSettings, setIsGamings] = useState(false);
  const [maxBetEnable, setMaxBetEnable] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);

  const [volume, setVolume] = useState(50);
  const [instantBet, setInstantBet] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [maxBet, setMaxBet] = useState(false);
  const [gameInfo, setGameInfo] = useState(false);
  const [hotkeys, setHotkeys] = useState(false);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(false);
  const [gameCheckout, setGameCheckout] = useState(false);
  const [startAutoBet, setStartAutoBet] = useState(false);

  const [currentBets, setCurrentBets] = useState({});

  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isGameJoined, setIsGameJoined] = useState(false);
  const socketRef = useRef(null);
  const namespaceTimeoutRef = useRef(null);
  const autoBetTimeoutRef = useRef(null);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);
  const walletType = useActiveWalletType();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);

  const [totalBetAmount, setTotalBetAmount] = useState(0);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [chipBet, setChipBet] = useState(() => {
    const saved = Number(localStorage.getItem(ROULETTE_CHIP_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : ROULETTE_DEFAULT_CHIP;
  });

  useEffect(() => {
    localStorage.setItem(ROULETTE_CHIP_KEY, String(chipBet));
  }, [chipBet]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROULETTE_HISTORY_KEY);
      if (saved) setCurrentHistory(JSON.parse(saved));
    } catch {
      setCurrentHistory([]);
    }
  }, []);

  const addToHistory = useCallback((pocket) => {
    const value = parseInt(pocket, 10);
    if (Number.isNaN(value) || value < 0 || value > 36) return;

    setCurrentHistory((prev) => {
      const next = [
        ...prev,
        {
          id: Date.now(),
          value,
          color: getRoulettePocketColor(value),
          timestamp: new Date().toISOString(),
        },
      ].slice(-MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(ROULETTE_HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setIsSocketReady(false);
      setIsGameJoined(false);
      setLoading(false);
      setIsInitializing(false);
      return undefined;
    }

    let cancelled = false;

    const markJoined = () => {
      if (cancelled) return;
      clearTimeout(namespaceTimeoutRef.current);
      setIsGameJoined(true);
      setIsSocketReady(true);
      setLoading(false);
      setIsInitializing(false);
      reconnectAttempts.current = 0;
    };

    const requestJoin = () => {
      joinGame((result) => {
        if (cancelled) return;
        if (result?.success !== false) {
          markJoined();
        } else {
          toast.error(
            result.message || "Failed to join game. Please refresh the page."
          );
          setLoading(false);
          setIsInitializing(false);
        }
      });
    };

    let unsubs = [];

    const setupSocket = async () => {
      try {
        setIsInitializing(true);
        setLoading(true);
        setIsSocketReady(false);
        setIsGameJoined(false);
        setIsAuthError(false);
        reconnectAttempts.current = 0;

        initializeRouletteSocket(token);
        const socket = getRouletteSocket();
        if (!socket) {
          throw new Error("Socket not initialized");
        }
        socketRef.current = socket;

        const onConnect = () => {
          if (cancelled) return;
          console.log("[Roulette Frame] Connected to server");
          setIsSocketReady(true);
          setLoading(false);
          requestJoin();
        };

        const onConnectError = (error) => {
          console.error("[Roulette Frame] Connection error:", error);
          if (
            error.message === "Authentication failed" ||
            error.message === "Invalid token"
          ) {
            setIsAuthError(true);
          }
          setIsSocketReady(false);
          setIsGameJoined(false);
          setLoading(false);
        };

        const onDisconnect = (reason) => {
          console.log("[Roulette Frame] Disconnected:", reason);
          setIsSocketReady(false);
          setIsGameJoined(false);
          setLoading(false);
        };

        socket.on("connect_error", onConnectError);
        socket.on("disconnect", onDisconnect);
        socket.on("connect", onConnect);

        unsubs = [
          () => socket.off("connect_error", onConnectError),
          () => socket.off("disconnect", onDisconnect),
          () => socket.off("connect", onConnect),
          subscribeGameJoined((data) => {
            if (cancelled) return;
            console.log("[Roulette Frame] Game joined:", data);
            if (data?.success !== false) {
              markJoined();
            } else {
              toast.error("Failed to join game. Please refresh the page.");
              setLoading(false);
              setIsInitializing(false);
            }
          }),
          subscribeSocketError((error) => {
            const message =
              typeof error === "string"
                ? error
                : error?.message || "Socket error";
            console.error("[Roulette Frame] Socket error:", message);
            if (
              message.includes("Authentication") ||
              message.includes("token")
            ) {
              setIsAuthError(true);
            }
          }),
        ];

        if (socket.connected) {
          onConnect();
        } else {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Socket connection timeout"));
            }, 10000);

            socket.once("connect", () => {
              clearTimeout(timeout);
              resolve();
            });

            socket.once("connect_error", (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
        }
      } catch (error) {
        console.error("[Roulette Frame] Error setting up socket:", error);
        if (
          error.message?.includes("Authentication") ||
          error.message?.includes("token")
        ) {
          setIsAuthError(true);
        } else {
          toast.error("Failed to connect to game server");
        }
        setIsSocketReady(false);
        setIsGameJoined(false);
        setLoading(false);
        setIsInitializing(false);
      }
    };

    setupSocket();

    return () => {
      cancelled = true;
      clearTimeout(namespaceTimeoutRef.current);
      unsubs.forEach((unsub) => unsub());
    };
  }, [token]);

  const handleBetstarted = () => {
    if (!token) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (Object.keys(currentBets).length === 0) {
      toast.error("Please place a bet on the table first");
      return;
    }

    const tableTotal = Object.values(currentBets).reduce(
      (sum, amount) => sum + parseFloat(amount),
      0
    );
    if (tableTotal <= 0) {
      toast.error("Please place a bet on the table first");
      return;
    }

    if (!betStarted && !isProcessing && isBettingEnabled && isSpinComplete) {
      console.log("[Roulette Frame] Starting bet with:", {
        currentBets,
        tableTotal,
        chipBet,
        socketId: socketRef.current?.id,
      });
      setBettingStarted(true);
    }
  };

  const handleCheckout = () => {
    setGameCheckout(true);
    setBettingStarted(false);
  };

  const handleAnimationComplete = useCallback(() => {
    console.log("[Roulette Frame] Wheel animation complete");
    setIsWheelAnimationComplete(true);
  }, []);

  const handleAutoBet = () => {
    if (!token) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    const tableTotal = Object.values(currentBets).reduce(
      (sum, amount) => sum + parseFloat(amount),
      0
    );

    if (nbets <= 0) {
      toast.error("Please set a valid number of bets");
      return;
    }

    if (Object.keys(currentBets).length === 0 || tableTotal <= 0) {
      toast.error("Please place a bet on the table first");
      return;
    }

    // Calculate total bet amount
    const totalAmount =
      Object.values(currentBets).reduce(
        (sum, amount) => sum + parseFloat(amount),
        0
      ) * nbets;
    setTotalBetAmount(totalAmount);

    if (
      !startAutoBet &&
      !isProcessing &&
      isBettingEnabled &&
      isSpinComplete &&
      isWheelAnimationComplete
    ) {
      console.log("[Roulette Frame] Starting auto bet with:", {
        currentBets,
        chipBet,
        nbets,
        totalBetAmount: totalAmount,
        socketId: socketRef.current?.id,
      });

      // Reset states before starting new auto-bet
      setStartAutoBet(false);
      setIsAutoBetting(false);
      setIsWheelAnimationComplete(true);

      // Start auto bet sequence
      setStartAutoBet(true);
      setIsAutoBetting(true);

      // Function to place bets with proper sequencing
      const placeAutoBets = async (count = 0) => {
        // Clear any existing timeout
        if (autoBetTimeoutRef.current) {
          clearTimeout(autoBetTimeoutRef.current);
        }

        // Only check count against nbets
        if (count >= nbets) {
          console.log("[Roulette Frame] Auto bet sequence complete");
          setStartAutoBet(false);
          setIsAutoBetting(false);
          setIsWheelAnimationComplete(true);
          // Only clear bets after all bets are complete
          setCurrentBets({});
          setTotalBetAmount(0);
          return;
        }

        // Wait for any ongoing processing to complete
        if (
          isProcessing ||
          !isBettingEnabled ||
          !isSpinComplete ||
          !isWheelAnimationComplete
        ) {
          console.log("[Roulette Frame] Waiting for game to be ready...");
          autoBetTimeoutRef.current = setTimeout(
            () => placeAutoBets(count),
            1000
          );
          return;
        }

        console.log(`[Roulette Frame] Placing bet ${count + 1} of ${nbets}`);

        // Reset wheel animation state before placing bet
        setIsWheelAnimationComplete(false);

        // Place the bet by triggering betStarted
        setBettingStarted(true);

        // Wait for the wheel animation to complete
        const waitForWheelAnimation = () => {
          return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (isWheelAnimationComplete) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
          });
        };

        try {
          // Wait for the wheel animation to complete
          await waitForWheelAnimation();

          // Add delay before next bet
          console.log("[Roulette Frame] Waiting before next bet...");
          await new Promise((resolve) => setTimeout(resolve, 10500));

          // Proceed to next bet without clearing current bets
          placeAutoBets(count + 1);
        } catch (error) {
          console.error("[Roulette Frame] Error in auto bet sequence:", error);
          setStartAutoBet(false);
          setIsAutoBetting(false);
          // Only clear bets if there's an error
          setCurrentBets({});
        }
      };

      // Start the auto bet sequence
      placeAutoBets();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoBetTimeoutRef.current) {
        clearTimeout(autoBetTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px] max-lg:min-h-[calc(100vh-69px)] lg:min-h-[calc(100vh-92px)]"
      >
        <div
          className={`my-4 max-lg:my-2 lg:my-12 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] overflow-x-hidden ${
            theatreMode ? "max-w-[100%]" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative">
            <div className="relative grid min-w-0 grid-cols-12 lg:min-h-[600px] max-lg:min-h-0">
              {/* Left Section */}
              <SideBar
                handleAutoBet={handleAutoBet}
                startAutoBet={startAutoBet}
                theatreMode={theatreMode}
                setTheatreMode={setTheatreMode}
                setBetMode={setBetMode}
                profit={profit}
                setProfit={setProfit}
                setLoss={setLoss}
                nbets={nbets}
                setNbets={setNbets}
                betMode={betMode}
                maxBetEnable={maxBetEnable}
                loss={loss}
                setOnLoss={setOnLoss}
                setOnWin={setOnWin}
                onLoss={onLoss}
                onWin={onWin}
                onWinReset={onWinReset}
                onLossReset={onLossReset}
                setOnLossReset={setOnLossReset}
                setOnWinReset={setOnWinReset}
                Difficulty={Difficulty}
                setDifficulty={setDifficulty}
                bettingStarted={betStarted}
                handleBetstarted={handleBetstarted}
                totalprofit={totalProfit}
                handleCheckout={handleCheckout}
                isSocketReady={isSocketReady}
                isGameJoined={isGameJoined}
                isDisabled={isProcessing || !isBettingEnabled}
                isAutoBetting={isAutoBetting}
                isProcessing={
                  isProcessing || !isBettingEnabled || !isSpinComplete
                }
                totalBetAmount={totalBetAmount}
                currentBets={currentBets}
                chipBet={chipBet}
                setChipBet={setChipBet}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 order-1 relative min-w-0 overflow-x-hidden bg-gray-900`}
              >
                <div className="relative flex h-full min-h-[320px] w-full min-w-0 flex-col text-white max-lg:min-h-0 lg:min-h-[560px]">
                  <div className="absolute inset-x-0 top-2 z-10">
                    <History list={currentHistory} palette="roulette" />
                  </div>
                  {loading ? (
                    <h1 className="text-xl font-semibold m-auto">Loading...</h1>
                  ) : (
                    <div className="flex w-full min-w-0 flex-1 flex-col items-stretch justify-start px-2 pt-11 max-lg:pt-[calc(0.5rem+2.25rem+0.5rem)] lg:px-3 lg:pt-11">
                      <Game
                        betStarted={betStarted}
                        setBettingStarted={setBettingStarted}
                        currentBets={currentBets}
                        setCurrentBets={setCurrentBets}
                        isSocketReady={isSocketReady}
                        isGameJoined={isGameJoined}
                        nbets={nbets}
                        onAutoBetComplete={handleAutoBet}
                        setIsProcessing={setIsProcessing}
                        isProcessing={isProcessing}
                        isBettingEnabled={isBettingEnabled}
                        setIsBettingEnabled={setIsBettingEnabled}
                        setIsAutoBetting={setIsAutoBetting}
                        isSpinComplete={isSpinComplete}
                        setIsSpinComplete={setIsSpinComplete}
                        onAnimationComplete={handleAnimationComplete}
                        walletType={walletType}
                        onRoundResult={addToHistory}
                        chipBet={chipBet}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <FrameFooter
            isFav={isFav}
            isGameSettings={isGameSettings}
            setIsFav={setIsFav}
            setIsFairness={setIsFairness}
            setIsGamings={setIsGamings}
            volume={volume}
            setVolume={setVolume}
            instantBet={instantBet}
            setInstantBet={setInstantBet}
            animations={animations}
            setAnimations={setAnimations}
            maxBet={maxBet}
            setMaxBet={setMaxBet}
            gameInfo={gameInfo}
            setGameInfo={setGameInfo}
            hotkeys={hotkeys}
            setHotkeys={setHotkeys}
            maxBetEnable={maxBetEnable}
            setMaxBetEnable={setMaxBetEnable}
            theatreMode={theatreMode}
            setTheatreMode={setTheatreMode}
          />

          {/* Other modals */}
          {isFairness && (
            <div
              className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
              onClick={() => setIsFairness(false)}
            >
              <div className="text-white w-full flex items-center justify-center h-full">
                <div
                  className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FairnessModal setIsFairness={setIsFairness} />
                </div>
              </div>
            </div>
          )}

          {hotkeys && (
            <div
              className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
              onClick={() => setHotkeys(false)}
            >
              <div className="text-white w-full flex items-center justify-center h-full">
                <div
                  className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HotKeysModal
                    setHotkeys={setHotkeys}
                    hotkeysEnabled={hotkeysEnabled}
                    setHotkeysEnabled={setHotkeysEnabled}
                  />
                </div>
              </div>
            </div>
          )}

          {gameInfo && (
            <div
              className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
              onClick={() => setGameInfo(false)}
            >
              <div className="text-white w-full flex items-center justify-center h-full">
                <div
                  className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GameInfoModal setGameInfo={setGameInfo} />
                </div>
              </div>
            </div>
          )}

          {maxBet && !maxBetEnable && (
            <div
              className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
              onClick={() => setMaxBet(false)}
            >
              <div className="text-white w-full flex items-center justify-center h-full">
                <div
                  className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MaxBetModal
                    setMaxBet={setMaxBet}
                    setMaxBetEnable={setMaxBetEnable}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Frame;
