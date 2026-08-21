/* eslint-disable */
import { useEffect, useState, useRef } from "react";
import "../../../styles/Frame.css";
import "../../../styles/Wheel.css";
import SeedPairFairnessModal from "../../Frame/SeedPairFairnessModal";
import { DICE_FAIRNESS_FORMULA } from "../../../utils/originalsFairness";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import Sidebar from "./Sidebar";
import GameComponent from "./Game";
import History from "../../Frame/History";
import BetCalculator from "./Chances";

import { toast } from "react-toastify";
import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import {
  getDiceSocket,
  initializeDiceSocket,
  disconnectDiceSocket,
  joinGame,
  rollDice,
  getHistory,
  onGameJoinedHandler,
  onDiceResultHandler,
  onDiceUpdateHandler,
  onGameHistoryHandler,
  onErrorHandler,
} from "../../../socket/games/dice";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

const HISTORY_KEY = "dice_game_history";
const MAX_HISTORY_ITEMS = 50;

const DiceFrame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");

  const [isFairness, setIsFairness] = useState(false);
  const [isGameSettings, setIsGameSettings] = useState(false);
  const [maxBetEnable, setMaxBetEnable] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);

  const [volume, setVolume] = useState(50);
  const [instantBet, setInstantBet] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [maxBet, setMaxBet] = useState(false);
  const [gameInfo, setGameInfo] = useState(false);
  const [hotkeys, setHotkeys] = useState(false);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(false);

  const [rollUnder, setRollUnder] = useState(false);
  const [bettingStarted, setBettingStarted] = useState(false);
  const [start, setStart] = useState(false);

  const [Multiplier, setMultiplier] = useState(2.0);
  const [roll, setRoll] = useState("50.5");

  const [fixedPosition, setFixedPosition] = useState(roll);
  const [gameResult, setGameResult] = useState("");
  const [roundOutcome, setRoundOutcome] = useState(null);
  const [fairnessPrefill, setFairnessPrefill] = useState(null);
  const [targetPosition, setTargetPosition] = useState(fixedPosition);
  const [dicePosition, setDicePosition] = useState(fixedPosition);

  const [currentHistory, setCurrentHistory] = useState([]);
  const [winChance, setWinChance] = useState("50");
  const [startAutoBet, setStartAutoBet] = useState(false);

  const [isDisconnected, setIsDisconnected] = useState(false);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);
  const socketRef = useRef(null);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setCurrentHistory(parsedHistory);
        }
      } catch (error) {
        console.error("Error loading history from localStorage:", error);

        setCurrentHistory([]);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(currentHistory));
    } catch (error) {
      console.error("Error saving history to localStorage:", error);
    }
  }, [currentHistory]);

  const addToHistory = (result) => {
    if (!result) {
      console.error("Invalid result for history:", result);
      return;
    }

    const diceRoll = result.diceRoll || result.percentage;
    const isWin = result.isWin || result.won;

    if (typeof diceRoll === "undefined") {
      console.error("Invalid result format - missing diceRoll:", result);
      return;
    }

    const newHistoryItem = {
      id: Date.now(),
      roll: parseFloat(diceRoll).toFixed(1),
      color: isWin ? "#15803D" : "#DC2626",
    };

    setCurrentHistory((prevHistory) => {
      const newHistory = [...prevHistory, newHistoryItem];
      return newHistory.slice(-MAX_HISTORY_ITEMS);
    });
  };

  const clearHistory = () => {
    setCurrentHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const setupGameHandlers = () => {
    onGameJoinedHandler(() => {
      console.log("Game joined successfully");
    });

    onDiceResultHandler((result) => {
      if (!result) {
        console.error("Received null or undefined result");
        return;
      }

      try {
        const { diceRoll, isWin, profit, multiplier } = result;

        if (typeof diceRoll === "undefined") {
          console.error("Invalid result format:", result);
          return;
        }

        setGameResult(isWin ? "Winner! 🎉" : "You Lost! 😔");
        setDicePosition(diceRoll);
        setRoundOutcome({
          isWin: Boolean(isWin),
          roll: Number(diceRoll),
          multiplier: Number(multiplier) || parseFloat(calculateMultiplier(winChance)),
        });
        if (result.serverSeedHash) {
          setFairnessPrefill({
            clientSeed: result.clientSeed,
            serverSeedHash: result.serverSeedHash,
            nonce: result.nonce,
            observed: Number(diceRoll),
            observedLabel: "Last roll",
            observedDisplay: Number(diceRoll).toFixed(2),
          });
        }
        addToHistory(result);
        // Reflect the debit/credit in the in-game balance readout.
        requestWalletRefresh();

        if (profit > 0) {
          setProfit((prev) => (parseFloat(prev) + profit).toFixed(6));
        } else {
          setLoss((prev) => (parseFloat(prev) + Math.abs(profit)).toFixed(6));
        }

        setTimeout(() => {
          resetGame();
        }, 2600);
      } catch (error) {
        console.error("Error processing dice result:", error);
        toast.error("Error processing game result");
        resetGame();
      }
    });

    onDiceUpdateHandler((update) => {
      console.log("Game update:", update);
    });

    onErrorHandler((message) => {
      toast.error(message);
      // A rejected bet (e.g. insufficient balance) left the wallet untouched;
      // resync the readout in case it drifted.
      requestWalletRefresh();
      resetGame();
    });
  };

  useEffect(() => {
    let reconnectTimeout;
    let connectionAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;

    const setupSocket = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("?tab=login", { replace: true });
        return;
      }

      try {
        const existingSocket = getDiceSocket();
        if (existingSocket) {
          existingSocket.off("connect_error");
          existingSocket.off("disconnect");
          existingSocket.off("connect");
          existingSocket.disconnect();
        }

        await initializeDiceSocket(token);
        const socket = getDiceSocket();

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          if (error.message === "Authentication failed") {
            localStorage.removeItem("token");
            navigate("?tab=login", { replace: true });
          } else {
            setIsDisconnected(true);

            if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
              connectionAttempts++;
              const delay =
                RECONNECT_DELAY * Math.pow(2, connectionAttempts - 1);
              console.log(
                `Attempting reconnection in ${delay}ms (attempt ${connectionAttempts})`
              );
              reconnectTimeout = setTimeout(() => {
                if (isDisconnected) {
                  setupSocket();
                }
              }, delay);
            } else {
              console.error("Max reconnection attempts reached");
              toast.error(
                "Connection failed. Please try reconnecting manually."
              );
            }
          }
        });

        socket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setIsDisconnected(true);

          if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
            connectionAttempts++;
            const delay = RECONNECT_DELAY * Math.pow(2, connectionAttempts - 1);
            console.log(
              `Attempting reconnection in ${delay}ms (attempt ${connectionAttempts})`
            );
            reconnectTimeout = setTimeout(() => {
              if (isDisconnected) {
                setupSocket();
              }
            }, delay);
          } else {
            console.error("Max reconnection attempts reached");
            toast.error("Connection failed. Please try reconnecting manually.");
          }
        });

        socket.on("connect", () => {
          console.log("Socket connected successfully");
          connectionAttempts = 0;
          setIsDisconnected(false);
          joinGame();
        });

        socketRef.current = socket;
      } catch (error) {
        console.error("Error setting up socket:", error);
        setIsDisconnected(true);

        if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          connectionAttempts++;
          const delay = RECONNECT_DELAY * Math.pow(2, connectionAttempts - 1);
          console.log(
            `Attempting reconnection in ${delay}ms (attempt ${connectionAttempts})`
          );
          reconnectTimeout = setTimeout(() => {
            if (isDisconnected) {
              setupSocket();
            }
          }, delay);
        }
      }
    };

    setupSocket();
    setupGameHandlers();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      const socket = getDiceSocket();
      if (socket) {
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("connect");
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [navigate]);

  const handleReconnect = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("?tab=login", { replace: true });
        return;
      }

      setIsDisconnected(false);

      const existingSocket = getDiceSocket();
      if (existingSocket) {
        existingSocket.off("connect_error");
        existingSocket.off("disconnect");
        existingSocket.off("connect");
        existingSocket.disconnect();
      }

      socketRef.current = null;
      setBettingStarted(false);
      setStart(false);
      setGameResult("");
      setRoundOutcome(null);
      setDicePosition(fixedPosition);
      setTargetPosition(null);
      setStartAutoBet(false);

      await initializeDiceSocket(token);
      const socket = getDiceSocket();

      if (!socket) {
        throw new Error("Failed to initialize socket");
      }

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        if (error.message === "Authentication failed") {
          localStorage.removeItem("token");
          navigate("?tab=login", { replace: true });
        } else {
          setIsDisconnected(true);
          toast.error("Connection failed. Please try reconnecting again.");
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsDisconnected(true);
        toast.error("Disconnected from server. Please try reconnecting.");
      });

      socket.on("connect", () => {
        console.log("Socket reconnected successfully");
        setIsDisconnected(false);
        joinGame();
      });

      socketRef.current = socket;

      setupGameHandlers();
    } catch (error) {
      console.error("Error during reconnection:", error);
      setIsDisconnected(true);
      toast.error("Failed to reconnect. Please try again.");
    }
  };

  const initSocket = () => {
    const diceSocket = getDiceSocket();
    if (!diceSocket) {
      initializeDiceSocket(token);
    }
  };

  const validateBet = (betAmount) => {
    const bet = parseFloat(betAmount);

    if (isNaN(bet) || bet < 0) {
      toast.error("Please enter a valid bet amount", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return false;
    }

    if (maxBetEnable && bet > 1000) {
      toast.error("Maximum bet amount is 1000", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return false;
    }

    return true;
  };

  const handleBetClick = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!validateBet(bet)) {
      return;
    }

    if (Multiplier <= 1 || Multiplier >= 9990) {
      toast.error("Enter a Valid Multiplier (between 1 and 9990)", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    if (roll <= 0 || roll >= 100) {
      toast.error("Invalid roll value. Must be between 0 and 100", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    const prediction = parseFloat(roll);

    if (!bettingStarted) {
      joinGame();
    }

    const success = rollDice(parseFloat(bet), prediction, rollUnder, "demo");
    if (success) {
      setBettingStarted(true);
      setStart(true);
      setGameResult("");
      setDicePosition(fixedPosition);
      setTargetPosition(null);
    } else {
      toast.error("Failed to place bet. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const handleAutoBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!validateBet(bet)) {
      return;
    }

    if (!nbets || nbets <= 0 || nbets > 100) {
      toast.error("Please enter a valid number of bets (1-100)", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    if (!startAutoBet && nbets > 0) {
      joinGame();
      setStartAutoBet(true);
      autoBet(nbets);
    }
  };

  const autoBet = (remainingBets) => {
    if (remainingBets > 0) {
      handleBetClick();
      const gameDuration = 3500 + 500;

      setTimeout(() => {
        resetGame();
        autoBet(remainingBets - 1);
      }, gameDuration);
    } else {
      setStartAutoBet(false);
    }
  };

  useEffect(() => {
    if (start) {
      setDicePosition(fixedPosition);
      setStart(true);
    }
  }, [start, fixedPosition]);

  const resetGame = () => {
    setStart(false);
    setBettingStarted(false);
    setRoundOutcome(null);
    setGameResult("");
  };

  useEffect(() => {
    setWinChance(parseFloat(calculateWinChance(roll, rollUnder)).toFixed(2));
  }, [roll, rollUnder]);

  const calculateWinChance = (roll, rollUnder) => {
    return rollUnder ? roll : 100 - roll;
  };

  const calculateMultiplier = (winChance) => {
    const houseEdge = 1;
    return (100 - houseEdge) / winChance;
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
    <div
      className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px]"
      style={{ minHeight: "calc(100vh - 70px)" }}
    >
      <div
        className={`my-12 max-lg:my-3 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
          theatreMode ? "max-w-[100%]" : "max-lg:max-w-[450px]"
        }`}
      >
        <div className="flex flex-col gap-[0.15rem] relative">
          <div className="grid grid-cols-12 lg:h-[600px]">
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
                {...{
                  theatreMode,
                  setTheatreMode,
                  setBet,
                  setBetMode,
                  profit,
                  setProfit,
                  setLoss,
                  nbets,
                  setNBets,
                  betMode,
                  bet,
                  maxBetEnable,
                  bettingStarted,
                  handleBetClick,
                  startAutoBet,
                  handleAutoBet,
                }}
              />
            </div>

            <div
              className={`col-span-12 rounded-tr ${
                theatreMode
                  ? "md:col-span-8 md:order-2"
                  : "lg:col-span-8 lg:order-2"
              } xl:col-span-9 bg-gray-900 order-1 max-lg:h-auto max-lg:min-h-0 lg:h-[600px] relative`}
            >
              {isDisconnected && <DisconnectModal />}
              <div className="relative flex h-full min-h-0 w-full flex-col px-3 pt-1 text-white lg:px-5">
                <div className="pointer-events-none absolute inset-x-0 top-2 z-10">
                  <History list={currentHistory} />
                </div>
                <div className="flex min-h-[160px] w-full flex-1 items-center justify-center">
                  <GameComponent
                    {...{
                      setRollover: setRoll,
                      rollover: roll,
                      fixedPosition,
                      setFixedPosition,
                      gameResult,
                      setGameResult,
                      dicePosition,
                      setDicePosition,
                      Start: start,
                      rollUnder,
                      setMultiplier,
                      calculateMultiplier,
                      winChance,
                      targetPosition,
                      roundOutcome,
                    }}
                  />
                </div>
                <div className="mt-auto w-full shrink-0 pb-3 lg:pb-5">
                  <BetCalculator
                    {...{
                      rollUnder,
                      setRollUnder,
                      targetMultiplier: Multiplier,
                      setTargetMultiplier: setMultiplier,
                      roll,
                      setRoll,
                      winChance,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <FrameFooter
            {...{
              isFav,
              isGameSettings,
              setIsFav,
              setIsFairness,
              setIsGameSettings,
              volume,
              setVolume,
              instantBet,
              setInstantBet,
              animations,
              setAnimations,
              maxBet,
              setMaxBet,
              gameInfo,
              setGameInfo,
              hotkeys,
              setHotkeys,
              maxBetEnable,
              setMaxBetEnable,
              theatreMode,
              setTheatreMode,
            }}
            betMode={betMode}
            onBetModeChange={setBetMode}
            modeSwitchDisabled={startAutoBet || bettingStarted || start}
          />

          {isGameSettings && (
            <div
              className="absolute bg-transparent top-0 left-0 w-full h-full z-[2] cursor-pointer"
              onClick={() => setIsGameSettings(false)}
            ></div>
          )}

          {isFairness && (
            <div
              className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
              onClick={() => setIsFairness(false)}
            >
              <div
                className="text-white w-full flex items-center justify-center h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary">
                    <SeedPairFairnessModal
                      setIsFairness={setIsFairness}
                      prefill={fairnessPrefill}
                      gameKey="dice"
                      title="Provably Fair — Dice"
                      formula={DICE_FAIRNESS_FORMULA}
                      verifyLabel="Verify roll"
                      formatResult={(verification, last) => {
                        const roll =
                          verification?.result ?? last?.observed;
                        return roll != null
                          ? `Roll ${Number(roll).toFixed(2)}`
                          : "—";
                      }}
                    />
                </div>
              </div>
            </div>
          )}

          {hotkeys && (
            <div
              className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
              onClick={() => setHotkeys(false)}
            >
              <div
                className="text-white w-full flex items-center justify-center h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2">
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
              <div
                className="text-white w-full flex items-center justify-center h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2">
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
              <div
                className="text-white w-full flex items-center justify-center h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2">
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
  );
};

export default DiceFrame;
