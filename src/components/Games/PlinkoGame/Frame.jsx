/* eslint-disable */
import { useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import "../../../styles/Wheel.css";
import PlinkoFairnessModal from "./PlinkoFairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import Sidebar from "./Sidebar";
import Game from "./Game";
import PlinkoEngine from "./PlinkoEngine";
import usePlinkoStore from "./store";
import { toast } from "react-toastify";

import { useSelector } from "react-redux";
import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import {
  getPlinkoSocket,
  initializePlinkoSocket,
} from "../../../socket/games/plinko";

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");
  const [risk, setRisk] = useState("Medium");
  const [rows, setRows] = useState(12);
  const [isBallInMotion, setIsBallInMotion] = useState(false);
  const [plinkoFairness, setPlinkoFairness] = useState(null);

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
  const [bettingStarted, setBettingStarted] = useState(true);
  const [startAutoBet, setStartAutoBet] = useState(false);

  const canvasRef = useRef(null);
  const [engine, setEngine] = useState(null);

  const token = useSelector((state) => state.auth?.token);

  const initSocket = () => {
    const wheelSocket = getPlinkoSocket();
    if (!wheelSocket) {
      initializePlinkoSocket(token);
    }
  };

  const navigate = useNavigate();

  const setCurrentBinIndex = usePlinkoStore(
    (state) => state.setCurrentBinIndex
  );

  useEffect(() => {
    if (canvasRef.current) {
      const plinkoInstance = new PlinkoEngine(
        canvasRef.current,
        bet,
        rows,
        risk,
        setCurrentBinIndex
      );
      setEngine(plinkoInstance);
      plinkoInstance.start();

      return () => {
        plinkoInstance.stop();
        setEngine(null);
      };
    }
  }, [rows, risk]);

  useEffect(() => {
    if (engine) engine.betAmount = bet;
  }, [bet, engine]);

  useEffect(() => {
    const handleBallState = (event) => {
      setIsBallInMotion(event.detail.isInMotion);
    };

    window.addEventListener("plinko:ball_state", handleBallState);
    const handleFairness = (event) => {
      const fairness = event.detail?.fairness;
      if (fairness) setPlinkoFairness(fairness);
    };
    window.addEventListener("plinko:result", handleFairness);

    return () => {
      window.removeEventListener("plinko:ball_state", handleBallState);
      window.removeEventListener("plinko:result", handleFairness);
    };
  }, []);

  const handleBetClick = () => {
    if (bet === "" || bet == null || isNaN(bet) || parseFloat(bet) < 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!engine) return;

    initSocket();
    if (!getPlinkoSocket()) {
      toast.error("Failed to join game: Socket not connected");
      return;
    }

    engine.betAmount = bet;
    engine.dropBall();
  };

  const handleAutoBet = () => {
    if (bet === "" || bet == null || isNaN(bet) || parseFloat(bet) < 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    if (!nbets || isNaN(nbets) || parseInt(nbets) <= 0) {
      toast.error("Please enter a valid number of bets");
      return;
    }

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!engine) return;

    initSocket();

    if (!startAutoBet) {
      setStartAutoBet(true);
      const plinkoSocket = getPlinkoSocket();

      if (plinkoSocket) {
        engine.betAmount = bet;
        for (let i = 0; i < nbets; i++) {
          engine.dropBall();
        }

        setTimeout(() => {
          setStartAutoBet(false);
        }, 10000);
      } else {
        toast.error("Failed to join game: Socket not connected");
        setStartAutoBet(false);
      }
    }
  };

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[96px]"
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
            <div className="grid grid-cols-12 lg:h-[600px]">
              {/* Left Section */}
              <Sidebar
                theatreMode={theatreMode}
                setBetMode={setBetMode}
                betMode={betMode}
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                nbets={nbets}
                setNBets={setNBets}
                risk={risk}
                setRisk={setRisk}
                rows={rows}
                setRows={setRows}
                bettingStarted={bettingStarted}
                handleBetClick={handleBetClick}
                handleAutoBet={handleAutoBet}
                startAutoBet={startAutoBet}
                isBallInMotion={isBallInMotion}
                remainingBets={startAutoBet ? nbets : 0}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1 max-lg:h-auto max-lg:min-h-0 lg:h-[600px]`}
              >
                <div className="w-full relative text-white h-full flex items-center justify-center text-3xl">
                  {/* <History list={history} /> */}
                  <Game
                    bet={bet}
                    risk={risk}
                    rows={rows}
                    engine={engine}
                    canvasRef={canvasRef}
                    width={PlinkoEngine.WIDTH}
                    height={PlinkoEngine.HEIGHT}
                    nbets={nbets}
                    startAutoBet={startAutoBet}
                    setStartAutoBet={setStartAutoBet}
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
              modeSwitchDisabled={startAutoBet || isBallInMotion}
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
                      <PlinkoFairnessModal
                        setIsFairness={setIsFairness}
                        prefill={plinkoFairness}
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
