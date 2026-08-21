import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../../styles/Frame.css";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";
import TwistFairnessModal from "./TwistFairnessModal";

import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import {
  cashoutTwist,
  getTwistSocket,
  initializeTwistSocket,
  partialCashoutTwist,
} from "../../../socket/games/twist";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import {
  cashoutOdds,
  computeBoardPayout,
  formatMultiplier,
} from "./twistMultipliers";

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");
  const [gems, setGems] = useState([]);
  const [betStarted, setBettingStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalProfit, setTotalProfit] = useState("0.000000");
  const [betTrigger, setBettrigger] = useState(false);
  const [betInfo, setbetInfo] = useState([]);
  // states of diamonds
  const [green, setgreen] = useState(0);
  const [orange, setorange] = useState(0);
  const [purple, setpurple] = useState(0);
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
  const [randomSelect, setRandomSelect] = useState(false);
  const [gameCheckout, setGameCheckout] = useState(false);

  const [startAutoBet, setStartAutoBet] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [cashoutTarget, setCashoutTarget] = useState("0.00");
  const [partialCashoutTarget, setPartialCashoutTarget] = useState("0.00");

  const [fairnessPrefill, setFairnessPrefill] = useState(null);

  const startAutoBetRef = useRef(false);
  const autoRemainingRef = useRef(0);
  const cashoutTargetRef = useRef(cashoutTarget);
  const partialCashoutTargetRef = useRef(partialCashoutTarget);
  const autoSpinTimeoutRef = useRef(null);
  const pendingAutoContinueRef = useRef(false);

  startAutoBetRef.current = startAutoBet;
  cashoutTargetRef.current = cashoutTarget;
  partialCashoutTargetRef.current = partialCashoutTarget;

  const cashoutValue = useMemo(
    () => computeBoardPayout(bet, { green, orange, purple }),
    [bet, green, orange, purple]
  );
  const odds = useMemo(
    () => cashoutOdds({ green, orange, purple }),
    [green, orange, purple]
  );
  const canCashout = odds.gemCount > 0;
  const cashoutLabel = odds.showOdds
    ? `Cashout (${formatMultiplier(odds.full)})`
    : "Cashout";
  const partialCashoutLabel = odds.showOdds
    ? `Partial Cashout (${formatMultiplier(odds.partial)})`
    : "Partial Cashout";

  useEffect(() => {
    setTotalProfit(cashoutValue.toFixed(6));
  }, [cashoutValue]);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);
  const initSocket = () => {
    const twistSocket = getTwistSocket();
    if (!twistSocket) {
      initializeTwistSocket(token);
    }
  };

  const fireSpin = () => {
    setBettingStarted(true);
    setIsSpinning(true);
    setBettrigger(true);
  };

  const stopAutoBet = () => {
    startAutoBetRef.current = false;
    autoRemainingRef.current = 0;
    setStartAutoBet(false);
    if (autoSpinTimeoutRef.current) {
      clearTimeout(autoSpinTimeoutRef.current);
      autoSpinTimeoutRef.current = null;
    }
  };

  const handlebet = () => {
    if (isSpinning) return;

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!(parseFloat(bet) > 0)) {
      toast.error("Enter a bet amount");
      return;
    }

    initSocket();
    fireSpin();
  };

  const applyFullCashoutLocal = () => {
    setbetInfo([]);
    setorange(0);
    setpurple(0);
    setgreen(0);
    setGameCheckout(true);
    setBettingStarted(false);
    setBettrigger(false);
  };

  const scheduleNextAutoSpin = () => {
    autoRemainingRef.current -= 1;
    if (autoRemainingRef.current <= 0) {
      stopAutoBet();
      return;
    }

    autoSpinTimeoutRef.current = setTimeout(() => {
      if (!startAutoBetRef.current) return;
      fireSpin();
    }, 500);
  };

  const handleSpinFailed = useCallback(() => {
    setIsSpinning(false);
    setBettrigger(false);
    stopAutoBet();
  }, []);

  const handleFairness = useCallback((payload) => {
    setFairnessPrefill(payload);
  }, []);

  const handleSpinComplete = (progress) => {
    setIsSpinning(false);
    setBettrigger(false);

    if (!startAutoBetRef.current) return;

    const boardX = cashoutOdds(progress).full;
    const cashTarget = parseFloat(cashoutTargetRef.current) || 0;
    const partialTarget = parseFloat(partialCashoutTargetRef.current) || 0;

    if (cashTarget > 0 && boardX >= cashTarget) {
      cashoutTwist();
      stopAutoBet();
      return;
    }

    if (partialTarget > 0 && boardX >= partialTarget) {
      pendingAutoContinueRef.current = true;
      partialCashoutTwist();
      return;
    }

    scheduleNextAutoSpin();
  };

  const handleCheckout = () => {
    if (!canCashout || isSpinning) return;
    stopAutoBet();
    cashoutTwist();
  };

  const handlePartialCheckout = () => {
    if (!canCashout || isSpinning) return;
    setBettrigger(false);
    partialCashoutTwist();
  };

  const handleRandomSelect = () => {
    setRandomSelect(true);
  };

  const handleAutoBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    initSocket();

    if (startAutoBet) {
      stopAutoBet();
      return;
    }

    if (!(parseFloat(bet) > 0)) {
      toast.error("Enter a bet amount");
      return;
    }

    const rounds = Number(nbets);
    if (!Number.isFinite(rounds) || rounds <= 0 || isSpinning) return;

    autoRemainingRef.current = rounds;
    startAutoBetRef.current = true;
    setStartAutoBet(true);
    fireSpin();
  };

  useEffect(() => {
    if (token) {
      initSocket();
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const twistSocket = getTwistSocket();
    if (!twistSocket) return undefined;

    const applyProgress = (progress) => {
      if (!progress) return;
      setgreen(progress.green || 0);
      setorange(progress.orange || 0);
      setpurple(progress.purple || 0);
    };

    const onState = (state) => {
      applyProgress(state.progress);
      if (state.betAmount) {
        setBet(String(state.betAmount));
      }
      if (state.fairness) {
        setFairnessPrefill(state.fairness);
      }
    };

    const onCashout = (result) => {
      requestWalletRefresh();
      applyProgress(result.progress);
      applyFullCashoutLocal();
      if (result.fairness) {
        setFairnessPrefill(result.fairness);
      }
    };

    const onPartial = (result) => {
      requestWalletRefresh();
      applyProgress(result.progress);
      setGameCheckout(true);
      if (result.fairness) {
        setFairnessPrefill(result.fairness);
      }
      if (pendingAutoContinueRef.current) {
        pendingAutoContinueRef.current = false;
        scheduleNextAutoSpin();
      }
    };

    const onError = ({ message }) => {
      toast.error(message || "Twist request failed");
      requestWalletRefresh();
    };

    twistSocket.on("twist_state", onState);
    twistSocket.on("cashout_result", onCashout);
    twistSocket.on("partial_cashout_result", onPartial);
    twistSocket.on("error", onError);

    return () => {
      twistSocket.off("twist_state", onState);
      twistSocket.off("cashout_result", onCashout);
      twistSocket.off("partial_cashout_result", onPartial);
      twistSocket.off("error", onError);
    };
  }, [token]);

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[28px]"
        style={{
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <div
          className={`mx-auto my-3 w-[98%] rounded bg-primary max-w-[1400px] max-lg:my-2 max-lg:max-w-[450px] lg:my-8 ${
            theatreMode ? "max-h-screen max-w-[100%]" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="relative flex flex-col gap-[0.15rem]">
            <div className="grid grid-cols-12 max-lg:min-h-0 lg:min-h-[600px]">
              {/* Left Section */}
              <SideBar
                theatreMode={theatreMode}
                setTheatreMode={setTheatreMode}
                setBet={setBet}
                profit={profit}
                setProfit={setProfit}
                setLoss={setLoss}
                nbets={nbets}
                setNBets={setNBets}
                bet={bet}
                maxBetEnable={maxBetEnable}
                handlebet={handlebet}
                bettingStarted={betStarted}
                gems={gems}
                setGems={setGems}
                totalprofit={totalProfit}
                handleCheckout={handleCheckout}
                handlePartialCheckout={handlePartialCheckout}
                canCashout={canCashout}
                cashoutLabel={cashoutLabel}
                partialCashoutLabel={partialCashoutLabel}
                handleRandomSelect={handleRandomSelect}
                setBettingStarted={setBettingStarted}
                betTrigger={betTrigger}
                isSpinning={isSpinning}
                startAutoBet={startAutoBet}
                handleAutoBet={handleAutoBet}
                cashoutTarget={cashoutTarget}
                setCashoutTarget={setCashoutTarget}
                partialCashoutTarget={partialCashoutTarget}
                setPartialCashoutTarget={setPartialCashoutTarget}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr bg-gray-900 ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 order-1 max-lg:min-h-0`}
              >
                <div className="relative flex h-full min-h-[250px] w-full items-center justify-center overflow-hidden text-white max-lg:min-h-[280px] max-lg:py-3 lg:min-h-[580px] lg:text-3xl">
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-white lg:h-10 lg:w-10" />
                      <h1 className="text-base font-semibold lg:text-xl">
                        Connecting...
                      </h1>
                    </div>
                  ) : (
                    <Game
                      bet={bet}
                      betTrigger={betTrigger}
                      betInfo={betInfo}
                      setbetInfo={setbetInfo}
                      handleCheckout={handleCheckout}
                      onSpinComplete={handleSpinComplete}
                      onSpinFailed={handleSpinFailed}
                      onFairness={handleFairness}
                      green={green}
                      orange={orange}
                      purple={purple}
                      setgreen={setgreen}
                      setorange={setorange}
                      setpurple={setpurple}
                    />
                  )}
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
                      <TwistFairnessModal
                        setIsFairness={setIsFairness}
                        prefill={fairnessPrefill}
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
