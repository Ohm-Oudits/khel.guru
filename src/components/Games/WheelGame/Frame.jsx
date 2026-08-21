import { useState, useEffect } from "react";
import "../../../styles/Frame.css";
import "../../../styles/Wheel.css";
import SeedPairFairnessModal from "../../Frame/SeedPairFairnessModal";
import { WHEEL_FAIRNESS_FORMULA } from "../../../utils/originalsFairness";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import History from "../../Frame/History";
import Chances from "./Chances";
import Game from "./Game";

import { useSelector } from "react-redux";
import {
  getWheelSocket,
  initializeWheelSocket,
} from "../../../socket/games/wheel";
import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const WHEEL_HISTORY_KEY = "wheel_game_history";
const MAX_HISTORY_ITEMS = 50;

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [onWin, setOnWin] = useState(0);
  const [onLoss, setOnLoss] = useState(0);
  const [onWinReset, setOnWinReset] = useState(false);
  const [onLossReset, setOnLossReset] = useState(false);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");
  const [risk, setRisk] = useState("Medium");
  const [segment, setSegment] = useState(30);

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
  const [betStarted, setBettingStarted] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [currentHistory, setCurrentHistory] = useState([]);

  const token = useSelector((state) => state.auth?.token);

  const initSocket = () => {
    const wheelSocket = getWheelSocket();
    if (!wheelSocket) {
      initializeWheelSocket(token);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WHEEL_HISTORY_KEY);
      if (saved) setCurrentHistory(JSON.parse(saved));
    } catch {
      setCurrentHistory([]);
    }
  }, []);

  const addToHistory = (multiplier) => {
    const value = parseFloat(multiplier);
    if (!Number.isFinite(value)) return;
    setCurrentHistory((prev) => {
      const next = [
        ...prev,
        { id: Date.now(), value, timestamp: new Date().toISOString() },
      ].slice(-MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(WHEEL_HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  };

  const navigate = useNavigate();
  const handleMineBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    initSocket();
    if (!betStarted) {
      setBettingStarted(true);
    }
  };

  const handleAutoBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    initSocket();
    if (!autoStart) {
      setAutoStart(true);
    }
  };

  const handleModeSwitch = (mode) => {
    if (autoStart) {
      toast.error("Cannot switch modes while autobetting is in progress");
      return;
    }
    setBetMode(mode);
  };

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px] max-lg:min-h-[calc(100vh-69px)] lg:min-h-[calc(100vh-92px)]"
      >
        <div
          className={`my-4 max-lg:my-2 lg:my-12 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
            theatreMode ? "max-w-[100%] max-h-screen" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative">
            <div className="grid grid-cols-12 lg:min-h-[600px]">
              {/* Left Section */}
              <SideBar
                handleAutoBet={handleAutoBet}
                autoStart={autoStart}
                theatreMode={theatreMode}
                setTheatreMode={setTheatreMode}
                setBet={setBet}
                setBetMode={handleModeSwitch}
                profit={profit}
                setProfit={setProfit}
                setLoss={setLoss}
                nbets={nbets}
                setNBets={setNBets}
                betMode={betMode}
                bet={bet}
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
                riskSection
                segmentSection
                risk={risk}
                setRisk={setRisk}
                segment={segment}
                setSegment={setSegment}
                bettingStarted={betStarted}
                handleMineBet={handleMineBet}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 order-1 flex min-h-[360px] flex-col bg-gray-900 max-lg:min-h-[380px] lg:min-h-[600px]`}
              >
                <div className="shrink-0 pt-2">
                  <History list={currentHistory} palette="wheel" />
                </div>

                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                  <Game
                    risk={risk}
                    segment={segment}
                    betStarted={betStarted}
                    setBetStarted={setBettingStarted}
                    nbets={nbets}
                    autoStart={autoStart}
                    setAutoStart={setAutoStart}
                    bet={bet}
                    onHistory={addToHistory}
                    onFairness={setFairnessPrefill}
                  />
                </div>

                <div className="shrink-0 px-2 pb-2 pt-1">
                  <Chances risk={risk} segment={segment} />
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
              onBetModeChange={handleModeSwitch}
              modeSwitchDisabled={autoStart || betStarted}
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
                        gameKey="wheel"
                        title="Provably Fair — Wheel"
                        formula={WHEEL_FAIRNESS_FORMULA}
                        verifyLabel="Verify index"
                        formatResult={(verification, last) => {
                          const index =
                            verification?.result ?? last?.observed;
                          const multiplier = last?.multiplier;
                          if (index == null) return "—";
                          return multiplier != null
                            ? `Index ${index} · ${Number(multiplier).toFixed(2)}x`
                            : `Index ${index}`;
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
