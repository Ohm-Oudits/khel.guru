/* eslint-disable */
import { useEffect, useState, useRef } from "react";
import "../../../styles/Frame.css";
import "../../../styles/Wheel.css";
import SeedPairFairnessModal from "../../Frame/SeedPairFairnessModal";
import { LIMBO_FAIRNESS_FORMULA } from "../../../utils/originalsFairness";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import Sidebar from "./Sidebar";
import GameComponent from "./Game";
import History from "../../Frame/History";
import BetCalculator from "./Chances";

import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import {
  initializeLimboSocket,
  getLimboSocket,
  disconnectLimboSocket,
  joinGame,
  placeBet,
  onBetResult,
  onError,
  removeBetResultListener,
  removeErrorListener,
} from "../../../socket/games/limbo";
import { getGameHistory, addToGameHistory } from "../../../utils/gameHistory";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const Frame = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");

  const [start, setStart] = useState(false);

  const [Multipler, setMultipler] = useState(2.0);
  const [EstProfit, setEstProfit] = useState("0.000000");

  const [isFairness, setIsFairness] = useState(false);
  const [fairnessPrefill, setFairnessPrefill] = useState(null);
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

  const [bettingStarted, setBettingStarted] = useState(false);
  const [defaultColor, setDefaultColor] = useState(true);
  const [betCompleted, setBetCompleted] = useState(false);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [startAutoBet, setStartAutoBet] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(null);
  const animatingRef = useRef(false);
  const tickTimeoutRef = useRef(null);
  const revealTimeoutRef = useRef(null);
  const startedAtRef = useRef(0);
  const scrambleRef = useRef(1);
  const minAnimationDuration = 1600;

  const [number, setNumber] = useState(null);
  const [finalNumber, setFinalNumber] = useState(null);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [isAutoBetting, setIsAutoBetting] = useState(false);

  const [isDisconnected, setIsDisconnected] = useState(false);
  const socketRef = useRef(null);

  const validateBet = (betAmount) => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet < 0) {
      toast.error("Please enter a valid bet amount");
      return false;
    }
    if (bet > 1000000) {
      toast.error("Maximum bet amount is 1,000,000");
      return false;
    }
    return true;
  };

  const handleBetError = () => {
    setBettingStarted(false);
    setStartAutoBet(false);
  };

  const clearAnimationTick = () => {
    if (tickTimeoutRef.current) {
      clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = null;
    }
  };

  const clearRevealTimeout = () => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  };

  const startNumberAnimation = () => {
    clearAnimationTick();
    setDefaultColor(true);
    setFinalNumber(null);
    setNumber(null);

    if (!animations || instantBet) {
      animatingRef.current = false;
      setIsAnimating(false);
      return;
    }

    animatingRef.current = true;
    startedAtRef.current = Date.now();
    scrambleRef.current = 1 + Math.random() * 3;
    setIsAnimating(true);
    setDisplayNumber(scrambleRef.current.toFixed(2));

    const tick = () => {
      if (!animatingRef.current) return;
      const dir = Math.random() > 0.4 ? 1 : -1;
      const step = (0.35 + Math.random() * 8.5) * dir;
      scrambleRef.current = Math.max(
        1,
        Math.min(99.99, scrambleRef.current + step)
      );
      setDisplayNumber(scrambleRef.current.toFixed(2));
      tickTimeoutRef.current = setTimeout(tick, 45);
    };

    tickTimeoutRef.current = setTimeout(tick, 45);
  };

  const stopNumberAnimation = () => {
    animatingRef.current = false;
    clearAnimationTick();
    clearRevealTimeout();
    setIsAnimating(false);
  };

  const lastHistoryNonceRef = useRef(null);

  const revealBetResult = (result) => {
    stopNumberAnimation();
    const value = Number(result.number);
    const shown = Number.isFinite(value) ? value.toFixed(2) : result.number;
    setFinalNumber(result.number);
    setNumber(result.number);
    setDisplayNumber(shown);
    setDefaultColor(false);
    setBettingStarted(false);

    if (result.error) {
      setStartAutoBet(false);
      setIsAutoBetting(false);
    }

    setBetCompleted(true);

    const duplicateNonce =
      result?.nonce != null && lastHistoryNonceRef.current === result.nonce;
    if (result?.nonce != null) lastHistoryNonceRef.current = result.nonce;
    if (!duplicateNonce && !result?.error) {
      setCurrentHistory(addToGameHistory("limbo_game_history", result));
    }
    if (result?.serverSeedHash) {
      const shownValue = Number(result.number);
      setFairnessPrefill({
        clientSeed: result.clientSeed,
        serverSeedHash: result.serverSeedHash,
        nonce: result.nonce,
        observed: shownValue,
        observedLabel: "Last multiplier",
        observedDisplay: Number.isFinite(shownValue)
          ? `${shownValue.toFixed(2)}x`
          : String(result.number),
      });
    }
  };

  const handleBetResult = (result) => {
    requestWalletRefresh();
    if (result?.error) {
      revealBetResult(result);
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const wait = animatingRef.current
      ? Math.max(0, minAnimationDuration - elapsed)
      : 0;

    clearRevealTimeout();
    revealTimeoutRef.current = setTimeout(() => {
      revealBetResult(result);
    }, wait);
  };

  const handleBetResultRef = useRef(handleBetResult);
  handleBetResultRef.current = handleBetResult;

  useEffect(() => {
    return () => {
      stopNumberAnimation();
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      initializeLimboSocket(token);
      const socket = getLimboSocket();

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        if (error.message === "Authentication failed") {
          navigate("?tab=login", { replace: true });
        } else {
          setIsDisconnected(true);
        }
      });

      socket.on("disconnect", () => {
        setIsDisconnected(true);
      });

      socket.on("connect", () => {
        setIsDisconnected(false);
        if (!socketRef.current) {
          joinGame(() => {
            console.log("Joined Limbo game");
          });
        }
      });

      socketRef.current = socket;

      setCurrentHistory(getGameHistory("limbo_game_history"));

      onError(({ message }) => {
        console.error("Game error:", message);
        toast.error(message);
        // A rejected bet (e.g. insufficient balance) left the wallet
        // untouched; resync the readout in case it drifted.
        requestWalletRefresh();
        handleBetError();
        stopNumberAnimation();
        setIsAutoBetting(false);
      });

      onBetResult((result) => {
        console.log("Bet result received:", result);
        handleBetResultRef.current(result);
      });

      return () => {
        removeErrorListener();
        removeBetResultListener();
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("connect");
        disconnectLimboSocket();
      };
    }
  }, [navigate]);

  const startGame = () => {
    setDefaultColor(true);
    setStart(true);
    setFinalNumber(null);
    setNumber(null);
  };

  const handleBetClick = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!validateBet(bet)) {
      return;
    }

    if (!bettingStarted) {
      setBettingStarted(true);
      startNumberAnimation();
      placeBet(
        parseFloat(bet),
        parseFloat(targetMultiplier),
        (result) => {
          console.log("Bet placed successfully");
        },
        "demo"
      );
    }
  };

  const handleAutoBet = () => {
    console.log("Handle auto bet clicked");

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!validateBet(bet)) {
      console.log("Invalid bet amount");
      return;
    }

    const numBets = parseInt(nbets);
    if (isNaN(numBets) || numBets <= 0) {
      toast.error("Please enter a valid number of bets");
      console.log("Invalid number of bets");
      return;
    }
    if (numBets > 100) {
      toast.error("Maximum number of auto bets is 100");
      console.log("Too many bets");
      return;
    }

    console.log("Starting auto bet with", numBets, "bets");

    setStartAutoBet(false);
    setIsAutoBetting(false);

    setTimeout(() => {
      setIsAutoBetting(true);
      setStartAutoBet(true);
      autoBet(numBets);
    }, 100);
  };

  const autoBet = (remainingBets) => {
    console.log(
      "Auto bet called with remaining bets:",
      remainingBets,
      "startAutoBet:",
      startAutoBet
    );

    if (remainingBets <= 0) {
      console.log("No more bets remaining");
      setStartAutoBet(false);
      setIsAutoBetting(false);
      return;
    }

    console.log("Placing bet...");
    startNumberAnimation();
    placeBet(
      parseFloat(bet),
      parseFloat(targetMultiplier),
      (result) => {
        console.log("Bet placed, remaining bets:", remainingBets - 1);

        setTimeout(() => {
          if (remainingBets > 1) {
            console.log("Scheduling next bet...");
            autoBet(remainingBets - 1);
          } else {
            console.log("All bets completed");
            setStartAutoBet(false);
            setIsAutoBetting(false);
          }
        }, 1500);
      },
      "demo"
    );
  };

  useEffect(() => {
    return () => {
      setStartAutoBet(false);
      setIsAutoBetting(false);
    };
  }, []);

  const handleReconnect = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("?tab=login", { replace: true });
        return;
      }

      // First set disconnected to false to remove modal
      setIsDisconnected(false);

      // Disconnect and clean up existing socket
      const existingSocket = getLimboSocket();
      if (existingSocket) {
        removeErrorListener();
        removeBetResultListener();
        existingSocket.off("connect_error");
        existingSocket.off("disconnect");
        existingSocket.off("connect");
        existingSocket.disconnect();
      }

      // Clear socket reference and reset game state
      socketRef.current = null;
      setBettingStarted(false);
      setStart(false);
      setFinalNumber(null);
      setNumber(null);
      setDisplayNumber(null);
      setDefaultColor(true);
      setStartAutoBet(false);
      setIsAutoBetting(false);
      setBetCompleted(false);

      // Reinitialize socket
      await initializeLimboSocket(token);
      const socket = getLimboSocket();

      // Set up socket event handlers
      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        if (error.message === "Authentication failed") {
          localStorage.removeItem("token");
          navigate("?tab=login", { replace: true });
        } else {
          setIsDisconnected(true);
        }
      });

      socket.on("disconnect", () => {
        setIsDisconnected(true);
      });

      socket.on("connect", () => {
        console.log("Socket reconnected successfully");
        setIsDisconnected(false);
        joinGame(() => {
          console.log("Rejoined Limbo game");
          socketRef.current = socket;
        });
      });

      // Set up game event handlers
      onError(({ message }) => {
        console.error("Game error:", message);
        toast.error(message);
        // A rejected bet (e.g. insufficient balance) left the wallet
        // untouched; resync the readout in case it drifted.
        requestWalletRefresh();
        handleBetError();
        stopNumberAnimation();
        setIsAutoBetting(false);
      });

      onBetResult((result) => {
        console.log("Bet result received:", result);
        handleBetResultRef.current(result);
      });
    } catch (error) {
      console.error("Error during reconnection:", error);
      setIsDisconnected(true);
      toast.error("Failed to reconnect. Please try again.");
    }
  };

  const DisconnectModal = () => (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 rounded-tr">
      <motion.div
        className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
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
            <motion.button
              className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReconnect}
            >
              Reconnect
            </motion.button>
          ) : (
            <motion.button
              className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("?tab=login", { replace: true })}
            >
              Login
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px]"
        style={{
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <div
          className={`my-12 max-lg:my-3 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
            theatreMode ? "max-w-[100%] max-h-screen" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative">
            <div className="grid grid-cols-12 lg:h-[650px]">
              {/* Left Section */}
              <div
                className={`col-span-12 ${
                  theatreMode
                    ? "md:col-span-4 md:order-1"
                    : "lg:col-span-4 lg:order-1"
                } xl:col-span-3 order-2 ${
                  isDisconnected ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Sidebar
                  theatreMode={theatreMode}
                  setTheatreMode={setTheatreMode}
                  setBet={setBet}
                  setBetMode={setBetMode}
                  profit={profit}
                  setProfit={setProfit}
                  setLoss={setLoss}
                  nbets={nbets}
                  setNBets={setNBets}
                  betMode={betMode}
                  bet={bet}
                  maxBetEnable={maxBetEnable}
                  bettingStarted={bettingStarted}
                  handleBetClick={handleBetClick}
                  startAutoBet={startAutoBet}
                  handleAutoBet={handleAutoBet}
                  isAutoBetting={isAutoBetting}
                />
              </div>

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1 max-lg:h-auto max-lg:min-h-0 lg:h-[650px] relative`}
              >
                {isDisconnected && <DisconnectModal />}
                <div className="relative flex h-full min-h-0 w-full flex-col px-3 pt-1 text-white lg:px-4">
                  <div className="pointer-events-none absolute inset-x-0 top-2 z-10">
                    <History list={currentHistory} />
                  </div>
                  <div className="flex min-h-[160px] flex-1 items-center justify-center">
                    <GameComponent
                      targetMultiplier={targetMultiplier}
                      number={displayNumber || number}
                      finalNumber={finalNumber}
                      defaultColor={defaultColor}
                      isAnimating={isAnimating}
                    />
                  </div>
                  <div className="mt-auto w-full shrink-0 pb-3 lg:pb-5">
                    <BetCalculator
                      bet={bet}
                      setMultiplier={setMultipler}
                      setDefaultColor={setDefaultColor}
                      bettingStarted={bettingStarted}
                      setEstProfit={setEstProfit}
                      targetMultiplier={targetMultiplier}
                      setTargetMultiplier={setTargetMultiplier}
                      startAutoBet={startAutoBet}
                    />
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
              betMode={betMode}
              onBetModeChange={setBetMode}
              modeSwitchDisabled={startAutoBet || bettingStarted}
            />

            {isGameSettings && (
              <div
                className="absolute bg-transparent top-0 left-0 w-full h-full z-[2] cursor-pointer"
                onClick={() => setIsGamings(false)}
              ></div>
            )}

            {/* Fairness Modal */}
            {isFairness && (
              <>
                <div
                  className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                  onClick={() => setIsFairness(false)}
                >
                  <div className="text-white w-full flex items-center justify-center h-full ">
                    <div
                      className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SeedPairFairnessModal
                        setIsFairness={setIsFairness}
                        prefill={fairnessPrefill}
                        gameKey="limbo"
                        title="Provably Fair — Limbo"
                        formula={LIMBO_FAIRNESS_FORMULA}
                        verifyLabel="Verify multiplier"
                        formatResult={(verification, last) => {
                          const value =
                            verification?.result ?? last?.observed;
                          return value != null
                            ? `${Number(value).toFixed(2)}x`
                            : "—";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {hotkeys && (
              <>
                <div
                  className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                  onClick={() => setHotkeys(false)}
                >
                  <div className="text-white w-full flex items-center justify-center h-full ">
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
              </>
            )}

            {gameInfo && (
              <div
                className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                onClick={() => setGameInfo(false)}
              >
                <div className="text-white w-full flex items-center justify-center h-full ">
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
                <div className="text-white w-full flex items-center justify-center h-full ">
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
      </div>
    </>
  );
};

export default Frame;
