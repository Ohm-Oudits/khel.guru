/* eslint-disable */
import { useCallback, useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import "../../../styles/Wheel.css";
import FairnessModal from "../../Frame/FairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import Sidebar from "./Sidebar";
import GameComponent from "./Game";
import History from "../../Frame/History";

import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import {
  getPumpSocket,
  initializePumpSocket,
  placePumpBet,
  cashOutPump,
  pumpRound,
} from "../../../socket/games/pump";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";

const PUMP_HISTORY_KEY = "pump-round-history";

const Frame = () => {
  // main states
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(1);
  const [autoPumps, setAutoPumps] = useState(1);
  const [bet, setBet] = useState("1.00");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");

  // options
  const [isFairness, setIsFairness] = useState(false);
  const [isGameSettings, setIsGamings] = useState(false);
  const [maxBetEnable, setMaxBetEnable] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);
  // left back side
  const [volume, setVolume] = useState(50);
  const [instantBet, setInstantBet] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [maxBet, setMaxBet] = useState(false);
  const [gameInfo, setGameInfo] = useState(false);
  const [hotkeys, setHotkeys] = useState(false);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(false);

  const [bettingStarted, setBettingStarted] = useState(false);
  const [roundHistory, setRoundHistory] = useState([]);
  const [startAutoBet, setStartAutoBet] = useState(false);
  const [risk, setrisk] = useState("Low");

  const [balloonNumber, setBalloonNumber] = useState(1.01);
  const [isPopped, setIsPopped] = useState(false);
  const [roundLocked, setRoundLocked] = useState(false);
  const [pumpMultipler, setPumpMultipler] = useState([
    1.01, 1.23, 1.55, 1.98, 2.56, 3.36, 4.48, 6.08, 12.0, 35.0, 50.0, 73.0,
    144.0, 200.0,
  ]);

  useEffect(() => {
    if (risk == "Low") {
      setPumpMultipler([
        1.01, 1.23, 1.55, 1.98, 2.56, 3.36, 4.48, 6.08, 12.0, 35.0, 50.0, 73.0,
        144.0, 200.0,
      ]);
    } else if (risk == "Medium") {
      setPumpMultipler([1.01, 1.55, 2.56, 6.08, 12.0, 35.0, 50.0, 73.0, 200.0]);
    } else if (risk == "High") {
      setPumpMultipler([1.01, 2.56, 6.08, 35.0, 50.0, 73.0, 200.0]);
    }
  }, [risk]);

  const addRoundHistory = useCallback((multiplier) => {
    const nextValue = Math.floor(parseFloat(multiplier) * 100) / 100;
    if (!Number.isFinite(nextValue)) return;
    setRoundHistory((prev) => {
      const last = prev[prev.length - 1];
      const lastTs = Date.parse(last?.timestamp || 0);
      if (
        last &&
        last.value === nextValue &&
        Date.now() - lastTs < 1500
      ) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          value: nextValue,
          timestamp: new Date().toISOString(),
        },
      ].slice(-50);
    });
  }, []);

  const hydrateRoundHistory = useCallback((entries) => {
    if (!Array.isArray(entries)) return;
    setRoundHistory(
      entries
        .filter((item) => Number.isFinite(Number(item.value)))
        .map((item) => ({
          id: item.id,
          value: Number(item.value),
          timestamp: item.timestamp || new Date().toISOString(),
        }))
        .reverse()
    );
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PUMP_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setRoundHistory(parsed);
        }
      }
    } catch {
      setRoundHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!roundHistory.length) return;
    try {
      localStorage.setItem(PUMP_HISTORY_KEY, JSON.stringify(roundHistory));
    } catch {
      // ignore quota errors
    }
  }, [roundHistory]);

  const applyServerHistory = useCallback(
    (history, fallbackValue) => {
      if (Array.isArray(history) && history.length) {
        hydrateRoundHistory(history);
        return;
      }
      if (Number.isFinite(Number(fallbackValue))) {
        addRoundHistory(fallbackValue);
      }
    },
    [hydrateRoundHistory, addRoundHistory]
  );

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  // True while a stake is committed to the running round and not yet
  // settled (cashed out / popped / rejected). Guards against emitting a
  // second debit or a second settlement for the same round.
  const activeBetRef = useRef(false);
  const roundHandlersRef = useRef(null);
  const autoBetActiveRef = useRef(false);
  const autoBetsRemainingRef = useRef(0);
  const autoPumpsPerRoundRef = useRef(1);
  const autoPumpsDoneRef = useRef(0);
  const handleBetClickRef = useRef(() => {});
  const scheduleNextAutoBetRef = useRef(() => {});
  const runAutoPumpStepRef = useRef(() => {});

  const resetRound = () => {
    setRoundLocked(false);
    setBettingStarted(false);
    setIsPopped(false);
    setBalloonNumber(pumpMultipler[0] || 1.01);
    activeBetRef.current = false;
  };

  const handleRoundSettle = () => {
    setRoundLocked(true);
    setBettingStarted(false);
  };

  const applyServerHistoryRef = useRef(applyServerHistory);
  const hydrateRoundHistoryRef = useRef(hydrateRoundHistory);

  useEffect(() => {
    applyServerHistoryRef.current = applyServerHistory;
  }, [applyServerHistory]);

  useEffect(() => {
    hydrateRoundHistoryRef.current = hydrateRoundHistory;
  }, [hydrateRoundHistory]);

  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    const pumpSocket = initializePumpSocket(authToken);
    if (!pumpSocket) return;

    const onRoundHistory = (payload) => {
      const history = Array.isArray(payload?.history)
        ? payload.history
        : Array.isArray(payload)
          ? payload
          : [];
      if (history.length) {
        hydrateRoundHistoryRef.current(history);
      }
    };

    const onRoundStarted = ({ multiplier, ladder }) => {
      if (Array.isArray(ladder) && ladder.length) {
        setPumpMultipler(ladder);
      }
      setBalloonNumber(Number(multiplier) || ladder?.[0] || 1.01);
      setIsPopped(false);
      setBettingStarted(true);
      setRoundLocked(false);
      activeBetRef.current = true;
      autoPumpsDoneRef.current = 0;
      if (autoBetActiveRef.current) {
        setTimeout(() => runAutoPumpStepRef.current(), 450);
      }
    };

    const onPumpSuccess = ({ multiplier }) => {
      setBalloonNumber(Number(multiplier));
      if (!autoBetActiveRef.current) return;

      autoPumpsDoneRef.current += 1;
      if (autoPumpsDoneRef.current >= autoPumpsPerRoundRef.current) {
        setTimeout(() => {
          setRoundLocked(true);
          setBettingStarted(false);
          cashOutPump();
        }, 350);
        return;
      }

      setTimeout(() => runAutoPumpStepRef.current(), 350);
    };

    const onBalloonPopped = ({ multiplier, history }) => {
      applyServerHistoryRef.current(history, multiplier);
      handleRoundSettle();
      if (Number.isFinite(Number(multiplier))) {
        setBalloonNumber(Number(multiplier));
      }
      setIsPopped(true);
      activeBetRef.current = false;
      requestWalletRefresh();
      setTimeout(() => {
        resetRound();
        if (autoBetActiveRef.current) {
          scheduleNextAutoBetRef.current();
        }
      }, 900);
    };

    const onCashoutSuccess = ({ multiplier, payout, popAt, history }) => {
      applyServerHistoryRef.current(history, popAt);
      handleRoundSettle();
      activeBetRef.current = false;
      toast.success(
        `Cashed out at ${Number(multiplier).toFixed(2)}x for ${Number(
          payout
        ).toFixed(2)}`
      );
      requestWalletRefresh();
      setTimeout(() => {
        resetRound();
        if (autoBetActiveRef.current) {
          scheduleNextAutoBetRef.current();
        }
      }, 1100);
    };

    if (!pumpSocket.__walletHandlersBound) {
      pumpSocket.__walletHandlersBound = true;
      pumpSocket.on("bet_placed", () => {
        requestWalletRefresh();
      });
      pumpSocket.on("bet_busted", () => {
        activeBetRef.current = false;
        requestWalletRefresh();
      });
      pumpSocket.on("error", ({ message }) => {
        toast.error(message);
        activeBetRef.current = false;
        autoBetActiveRef.current = false;
        setStartAutoBet(false);
        resetRound();
        requestWalletRefresh();
      });
    }

    const handlers = {
      round_history: onRoundHistory,
      round_started: onRoundStarted,
      pump_success: onPumpSuccess,
      balloon_popped: onBalloonPopped,
      cashout_success: onCashoutSuccess,
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      pumpSocket.on(event, handler);
    });

    const onConnect = () => {
      pumpSocket.emit("get_history");
    };

    pumpSocket.on("connect", onConnect);

    if (pumpSocket.connected) {
      pumpSocket.emit("get_history");
    }

    roundHandlersRef.current = handlers;

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        pumpSocket.off(event, handler);
      });
      pumpSocket.off("connect", onConnect);
      roundHandlersRef.current = null;
    };
  }, [token]);

  const initSocket = () => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return null;
    return initializePumpSocket(authToken);
  };

  const handleBetClick = () => {
    if (roundLocked || bettingStarted) return;

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    initSocket();

    const betAmount = parseFloat(bet);
    if (Number.isNaN(betAmount) || betAmount <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    if (activeBetRef.current) {
      return;
    }

    const pumpSocket = initSocket();
    if (!pumpSocket) {
      toast.error("Failed to connect. Please try again.");
      return;
    }

    const place = () => {
      pumpSocket.emit("add_game", {});
      if (!placePumpBet(betAmount, "demo", risk)) {
        toast.error("Failed to place bet. Please try again.");
      }
    };

    if (pumpSocket.connected) {
      place();
    } else {
      pumpSocket.once("connect", place);
    }
  };

  const handleAutoBet = () => {
    if (roundLocked || bettingStarted) return;

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    const bets = Number(nbets);
    const pumps = Number(autoPumps);
    if (!Number.isFinite(bets) || bets < 1) {
      toast.error("Enter a valid number of bets");
      return;
    }
    if (!Number.isFinite(pumps) || pumps < 1) {
      toast.error("Enter a valid number of pumps");
      return;
    }

    initSocket();
    if (!startAutoBet) {
      autoBetActiveRef.current = true;
      autoBetsRemainingRef.current = bets;
      autoPumpsPerRoundRef.current = pumps;
      autoPumpsDoneRef.current = 0;
      setStartAutoBet(true);
      handleBetClick();
    }
  };

  handleBetClickRef.current = handleBetClick;

  scheduleNextAutoBetRef.current = () => {
    autoBetsRemainingRef.current -= 1;
    if (autoBetsRemainingRef.current <= 0) {
      autoBetActiveRef.current = false;
      setStartAutoBet(false);
      return;
    }

    setTimeout(() => {
      if (autoBetActiveRef.current && !activeBetRef.current) {
        handleBetClickRef.current();
      }
    }, 500);
  };

  runAutoPumpStepRef.current = () => {
    if (!autoBetActiveRef.current || !activeBetRef.current) {
      return;
    }

    if (autoPumpsDoneRef.current >= autoPumpsPerRoundRef.current) {
      setRoundLocked(true);
      setBettingStarted(false);
      cashOutPump();
      return;
    }

    pumpRound();
  };

  const handlePump = () => {
    if (roundLocked || !bettingStarted || isPopped) return;
    pumpRound();
  };

  const handleCheckout = () => {
    if (roundLocked || !bettingStarted || isPopped) return;

    const ladderIndex = pumpMultipler.indexOf(balloonNumber);
    if (ladderIndex <= 0) {
      toast.error("Pump at least once before checkout");
      return;
    }

    handleRoundSettle();
    cashOutPump();
  };

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
            theatreMode ? "max-w-[100%]" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative overflow-visible">
            <div className="grid grid-cols-12 lg:h-[600px] overflow-visible">
              {/* Left Section */}
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
                autoPumps={autoPumps}
                setAutoPumps={setAutoPumps}
                betMode={betMode}
                bet={bet}
                maxBetEnable={maxBetEnable}
                bettingStarted={bettingStarted}
                roundLocked={roundLocked}
                handleBetClick={handleBetClick}
                startAutoBet={startAutoBet}
                handleAutoBet={handleAutoBet}
                handlePump={handlePump}
                handleCheckout={handleCheckout}
                risk={risk}
                setRisk={setrisk}
                balloonNumber={balloonNumber}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1 max-lg:h-auto max-lg:min-h-0 lg:h-[600px] relative overflow-visible`}
              >
                <div className="relative flex h-full min-h-0 w-full flex-col px-3 pt-1 text-white lg:px-5 overflow-visible">
                  <div className="pointer-events-none absolute inset-x-0 top-2 z-10">
                    <History list={roundHistory} palette="parachute" />
                  </div>
                  <div className="flex min-h-[192px] lg:min-h-[160px] flex-1 flex-col justify-end overflow-visible">
                    <GameComponent
                      balloonNumber={balloonNumber}
                      bettingStarted={bettingStarted}
                      isPopped={isPopped}
                      pumpMultipler={pumpMultipler}
                      roundLocked={roundLocked}
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
                      <FairnessModal setIsFairness={setIsFairness} />
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
