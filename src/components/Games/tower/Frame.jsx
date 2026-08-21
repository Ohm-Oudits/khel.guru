import { useCallback, useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import TowerFairnessModal from "./TowerFairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getTowerSocket,
  initializeTowerSocket,
  startTowerGame,
  checkoutTower,
} from "../../../socket/games/tower";
import checkLoggedIn from "../../../utils/isloggedIn";
import { getActiveWalletType } from "../../../utils/activeWallet";
import { toast } from "react-toastify";

const TOWER_RESET_DELAY_MS = 3000;

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [bet, setBet] = useState("0.000000");
  const [nbets, setNBets] = useState(0);
  const [Difficulty, setDifficulty] = useState("Easy");
  const [betStarted, setBettingStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalProfit, setTotalProfit] = useState("0.000000");
  const [sidebarDisabled, setSidebarDisabled] = useState(true);

  const [isFairness, setIsFairness] = useState(false);
  const [fairnessPrefill, setFairnessPrefill] = useState(null);

  const handleFairnessUpdate = useCallback((payload) => {
    if (!payload) return;
    setFairnessPrefill(payload);
    if (payload.open) {
      setIsFairness(true);
    }
  }, []);
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
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(4);
  const [autoArray, setAutoArray] = useState(
    Array.from({ length: rows }, () => Array(cols).fill(0))
  );
  const [roundLocked, setRoundLocked] = useState(false);
  const [canCheckout, setCanCheckout] = useState(false);
  const [boardResetKey, setBoardResetKey] = useState(0);
  const resetTimerRef = useRef(null);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearResetTimer(), [clearResetTimer]);

  const initSocket = () => {
    setLoading(true);
    const towerSocket = getTowerSocket();
    if (!towerSocket) {
      initializeTowerSocket(token);
    }
    setLoading(false);
  };

  const handleRoundSettle = useCallback(() => {
    clearResetTimer();
    setRoundLocked(true);
    setBettingStarted(false);
    resetTimerRef.current = setTimeout(() => {
      setRoundLocked(false);
      setBettingStarted(false);
      setBoardResetKey((key) => key + 1);
      resetTimerRef.current = null;
    }, TOWER_RESET_DELAY_MS);
  }, [clearResetTimer]);

  const handleRoundStart = useCallback(() => {
    clearResetTimer();
    setRoundLocked(false);
  }, [clearResetTimer]);

  const handleBetstarted = () => {
    if (roundLocked) return;

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    // Validate bet amount
    const betAmount = parseFloat(bet);
    // Allow a 0 bet (testing); reject only a NaN or negative amount.
    if (isNaN(betAmount) || betAmount < 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    initSocket();

    startTowerGame(betAmount, Difficulty, getActiveWalletType());

    if (!betStarted) {
      setBettingStarted(true);
    }
  };

  const handleCheckout = () => {
    if (roundLocked || !betStarted || !canCheckout) return;
    checkoutTower();
  };

  const handleAutoBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    // Validate bet amount
    const betAmount = parseFloat(bet);
    // Allow a 0 bet (testing); reject only a NaN or negative amount.
    if (isNaN(betAmount) || betAmount < 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    initSocket();
    const allRowsSelected =
      selectedBoxes.length === rows &&
      new Set(selectedBoxes.map((box) => box.row)).size === rows;
    if (!allRowsSelected) {
      toast.error("Select a box on every row first");
      return;
    }
    if (!startAutoBet && nbets != 0) {
      setStartAutoBet(true);
    }
  };

  const handleRandomBoxes = () => {
    if (startAutoBet || loading || roundLocked) return;

    const picks = [];
    const nextArray = Array.from({ length: rows }, (_, rowIndex) => {
      const col = Math.floor(Math.random() * cols);
      picks.push({ row: rowIndex, col });
      return Array.from({ length: cols }, (_, colIndex) =>
        colIndex === col ? 1 : 0
      );
    });
    setSelectedBoxes(picks);
    setAutoArray(nextArray);
  };

  const handleFooterModeSwitch = (mode) => {
    if (loading) return;
    if (mode === "manual") {
      if (startAutoBet) return;
      setSelectedBoxes([]);
      setAutoArray(Array.from({ length: rows }, () => Array(cols).fill(0)));
    } else if (betStarted) {
      return;
    }
    setBetMode(mode);
  };

  useEffect(() => {
    if (token) {
      initializeTowerSocket(token);
    }
  }, [token]);

  useEffect(() => {
    setAutoArray(Array.from({ length: rows }, () => Array(cols).fill(0)));
  }, [rows, cols]);

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
            <div className="grid grid-cols-12 max-lg:min-h-0 lg:min-h-0">
              {/* Left Section */}
              <SideBar
                theatreMode={theatreMode}
                setTheatreMode={setTheatreMode}
                setBet={setBet}
                nbets={nbets}
                setNBets={setNBets}
                betMode={betMode}
                bet={bet}
                maxBetEnable={maxBetEnable}
                Difficulty={Difficulty}
                setDifficulty={setDifficulty}
                bettingStarted={betStarted}
                handleBetstarted={handleBetstarted}
                totalprofit={totalProfit}
                handleCheckout={handleCheckout}
                canCheckout={canCheckout}
                roundLocked={roundLocked}
                startAutoBet={startAutoBet}
                handleAutoBet={handleAutoBet}
                handleRandomBoxes={handleRandomBoxes}
                selectedBoxes={selectedBoxes}
                rows={rows}
                disabled={loading}
              />

              {/* Right Section */}
              <div
                className={`order-1 col-span-12 rounded-tr bg-gray-900 ${
                  theatreMode
                    ? "md:order-2 md:col-span-8"
                    : "lg:order-2 lg:col-span-8"
                } xl:col-span-9`}
              >
                <div className="relative flex h-full min-h-0 items-end justify-center overflow-visible pb-1 pt-8 text-white max-lg:min-h-0 max-lg:pt-7 max-lg:pb-1 lg:min-h-0 lg:pt-10 lg:pb-1.5">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-white lg:h-12 lg:w-12" />
                      <h1 className="text-base font-semibold lg:text-xl">
                        Connecting...
                      </h1>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-end justify-center">
                      <Game
                        bettingStarted={betStarted}
                        Difficulty={Difficulty}
                        setBettingStarted={setBettingStarted}
                        startAutoBet={startAutoBet}
                        setStartAutoBet={setStartAutoBet}
                        autoSelectedBoxes={selectedBoxes}
                        setAutoSelectedBoxes={setSelectedBoxes}
                        mode={betMode}
                        nbets={nbets}
                        autoArray={autoArray}
                        setAutoArray={setAutoArray}
                        rows={rows}
                        cols={cols}
                        setRows={setRows}
                        setCols={setCols}
                        setSidebarDisabled={setSidebarDisabled}
                        bet={bet}
                        setBet={setBet}
                        onRoundSettle={handleRoundSettle}
                        onRoundStart={handleRoundStart}
                        onCheckoutAvailableChange={setCanCheckout}
                        onFairnessUpdate={handleFairnessUpdate}
                        boardResetKey={boardResetKey}
                        roundLocked={roundLocked}
                      />
                    </div>
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
              betMode={betMode}
              onBetModeChange={handleFooterModeSwitch}
              modeSwitchDisabled={loading || startAutoBet || betStarted || roundLocked}
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
                      <TowerFairnessModal
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
