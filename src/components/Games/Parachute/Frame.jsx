/* eslint-disable */
import { useCallback, useEffect, useState } from "react";
import "../../../styles/Frame.css";
import SeedPairFairnessModal from "../../Frame/SeedPairFairnessModal";
import { riskMultiplierFairnessFormula } from "../../../utils/originalsFairness";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import History from "../../Frame/History";
import Game from "./Game";
import SideBar from "./Sidebar";
import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import {
  getParachuteSocket,
  initializeParachuteSocket,
  subscribeParachuteHistory,
  checkoutParachute,
} from "../../../socket/games/parachute";
import { useSelector } from "react-redux";

const PARACHUTE_HISTORY_KEY = "parachute-crash-history";

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");
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
  const [startAutoBet, setStartAutoBet] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [value, setValue] = useState(1.0);
  const [pause, setPause] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [autoMultipyTarget, setAutoMultipyTarget] = useState("1.01");
  const [crashHistory, setCrashHistory] = useState([]);
  const [roundLocked, setRoundLocked] = useState(false);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  const addCrashHistory = useCallback((multiplier) => {
    const nextValue = Math.floor(parseFloat(multiplier) * 100) / 100;
    if (!Number.isFinite(nextValue)) return;
    setCrashHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.value === nextValue) return prev;
      return [
        ...prev,
        { id: Date.now(), value: nextValue, timestamp: new Date().toISOString() },
      ].slice(-50);
    });
  }, []);

  const hydrateCrashHistory = useCallback((entries) => {
    if (!Array.isArray(entries)) return;
    setCrashHistory(
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
      const saved = localStorage.getItem(PARACHUTE_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setCrashHistory(parsed);
        }
      }
    } catch {
      setCrashHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!crashHistory.length) return;
    try {
      localStorage.setItem(PARACHUTE_HISTORY_KEY, JSON.stringify(crashHistory));
    } catch {
      // ignore quota errors
    }
  }, [crashHistory]);

  const initSocket = () => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;
    initializeParachuteSocket(authToken);
  };

  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    initializeParachuteSocket(authToken);

    const unsubscribe = subscribeParachuteHistory((event) => {
      if (event.type === "history") {
        hydrateCrashHistory(event.history);
        return;
      }

      if (event.type === "crash") {
        if (Array.isArray(event.history) && event.history.length) {
          hydrateCrashHistory(event.history);
          return;
        }
        if (Number.isFinite(Number(event.multiplier))) {
          addCrashHistory(event.multiplier);
        }
        return;
      }

      if (event.type === "checkout") {
        if (Array.isArray(event.history) && event.history.length) {
          hydrateCrashHistory(event.history);
        } else if (Number.isFinite(Number(event.crashPoint))) {
          addCrashHistory(event.crashPoint);
        }
      }
    });

    const socket = getParachuteSocket();
    if (socket?.connected) {
      socket.emit("get_history");
    }

    return unsubscribe;
  }, [token, hydrateCrashHistory, addCrashHistory]);

  const handleRoundSettle = useCallback(() => {
    setRoundLocked(true);
    setBettingStarted(false);
    setCheckout(false);
  }, []);

  const handleRoundReady = useCallback(() => {
    setRoundLocked(false);
    setPause(false);
    setBettingStarted(false);
    setCheckout(false);
  }, []);

  const handleBetClick = () => {
    if (roundLocked || bettingStarted) return;

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    initSocket();
    setBettingStarted(true);
    setPause(false);
    setValue(1.0);
  };

  const handleCheckout = () => {
    if (roundLocked || !bettingStarted) return;

    const parachuteSocket = getParachuteSocket();
    if (!parachuteSocket) {
      console.error("Parachute socket not initialized");
      alert("Failed to join game: Socket not connected");
      return;
    }

    handleRoundSettle();
    setPause(true);
    checkoutParachute();
  };

  const handleAutoBet = () => {
    if (roundLocked || bettingStarted) return;

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    initSocket();
    if (!startAutoBet && nbets != 0 && autoMultipyTarget >= 1.01) {
      setStartAutoBet(true);
      setCheckout(true);
    }
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
          className={`my-12 max-lg:my-2 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
            theatreMode ? "max-w-[100%] max-h-screen" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative">
            <div className="grid grid-cols-12 max-lg:min-h-0 lg:h-[600px]">
              {/* Left Section */}
              <SideBar
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
                checkoutBox
                bettingStarted={bettingStarted}
                setBettingStarted={setBettingStarted}
                checkout={checkout}
                setCheckout={setCheckout}
                handleBetClick={handleBetClick}
                handleCheckout={handleCheckout}
                roundLocked={roundLocked}
                value={value}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                startAutoBet={startAutoBet}
                handleAutoBet={handleAutoBet}
                autoMultipyTarget={autoMultipyTarget}
                setAutoMultipyTarget={setAutoMultipyTarget}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 order-1 max-lg:min-h-[260px] max-lg:max-h-[300px] bg-gray-900`}
              >
                <div className="relative flex h-full w-full items-center justify-center text-3xl max-lg:text-xl text-white">
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/40 via-black/10 to-transparent px-1 pb-5 pt-2">
                    <History list={crashHistory} palette="parachute" />
                  </div>
                  <Game
                    bettingStarted={bettingStarted}
                    setBettingStarted={setBettingStarted}
                    bet={bet}
                    checkout={checkout}
                    setCheckout={setCheckout}
                    value={value}
                    setValue={setValue}
                    pause={pause}
                    setPause={setPause}
                    difficulty={difficulty}
                    autoMultipyTarget={autoMultipyTarget}
                    startAutoBet={startAutoBet}
                    setStartAutoBet={setStartAutoBet}
                    nbets={nbets}
                    onRoundCrash={addCrashHistory}
                    onRoundSettle={handleRoundSettle}
                    onRoundReady={handleRoundReady}
                    onFairness={setFairnessPrefill}
                    roundLocked={roundLocked}
                  />
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
              modeSwitchDisabled={startAutoBet || bettingStarted || roundLocked}
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
                        gameKey="parachute"
                        title="Provably Fair — Parachute"
                        formula={riskMultiplierFairnessFormula(
                          fairnessPrefill?.difficulty || difficulty
                        )}
                        seedHint="Rotate to reveal the previous server seed, then verify past rounds. The crash point is only shown after you cash out or the balloon pops."
                        verifyLabel="Verify crash point"
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
