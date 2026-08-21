import { useEffect, useState } from "react";
import "../../../styles/Frame.css";
import FairnessModal from "../../Frame/FairnessModal";
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
} from "../../../socket/games/tower";
import checkLoggedIn from "../../../utils/isloggedIn";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { toast } from "react-toastify";

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
  const [selectBoxes, setSelectBoxes] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(4);
  const [autoArray, setAutoArray] = useState(
    Array.from({ length: rows }, () => Array(cols).fill(0))
  );

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [profit, setProfit] = useState(0);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  const initSocket = () => {
    setLoading(true);
    const towerSocket = getTowerSocket();
    if (!towerSocket) {
      initializeTowerSocket(token);
    }
    setLoading(false);
  };

  const handleBetstarted = () => {
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

    if (!betStarted) {
      setBettingStarted(true);
    }
  };

  const handleCheckout = () => {
    const towerSocket = getTowerSocket();
    if (towerSocket?.connected) {
      console.log("Emitting checkout event...");
      towerSocket.emit("checkout");
      setBettingStarted(false);
      setShowGameOptions(false);
      setShowExistingGameModal(false);
    }
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
    if (!startAutoBet && nbets != 0) {
      setStartAutoBet(true);
    }
  };

  const setback = () => {
    if (!startAutoBet) {
      setStartAutoBet(false);
      setSelectBoxes(false);
    }
  };

  const handleSelectBoxes = () => {
    if (!selectBoxes && selectedBoxes.length > 0) {
      setSelectBoxes(true);
    }
  };

  const clearAutoSelectBoxes = () => {
    setSelectedBoxes([]);
    setAutoArray(Array.from({ length: rows }, () => Array(cols).fill(0)));
  };

  useEffect(() => {
    setAutoArray(Array.from({ length: rows }, () => Array(cols).fill(0)));
  }, [rows, cols]);

  useEffect(() => {
    const towerSocket = getTowerSocket();
    if (towerSocket) {
      towerSocket.on("game_state", (gameState) => {
        if (gameState) {
          if (gameState.checkedOut) {
            // The cashout just settled: refresh the balance readout.
            requestWalletRefresh();
            setProfit(gameState.profit);
            setShowCheckoutModal(true);
            setBettingStarted(false);
            setShowGameOptions(false);
            setShowExistingGameModal(false);
          }
        }
      });

      towerSocket.on("error", ({ message }) => {
        console.error("Game error:", message);
        // A rejected action left the wallet untouched; resync the readout.
        requestWalletRefresh();
        toast.error(`Error: ${message}`);
      });
    }

    return () => {
      if (towerSocket) {
        towerSocket.off("game_state");
        towerSocket.off("error");
      }
    };
  }, []);

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px]"
        style={{
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <div
          className={`my-12 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
            theatreMode ? "max-w-[100%] max-h-screen" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative">
            <div className="grid grid-cols-12 lg:min-h-[600px]">
              {/* Left Section */}
              <SideBar
                theatreMode={theatreMode}
                setTheatreMode={setTheatreMode}
                setBet={setBet}
                setBetMode={setBetMode}
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
                startAutoBet={startAutoBet}
                handleAutoBet={handleAutoBet}
                selectBoxes={selectBoxes}
                handleSelectBoxes={handleSelectBoxes}
                setback={setback}
                clearAutoSelectBoxes={clearAutoSelectBoxes}
                selectedBoxes={selectedBoxes}
                setSelectedBoxes={setSelectedBoxes}
                setSelectBoxes={setSelectBoxes}
                disabled={loading}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1`}
              >
                <div className="w-full relative text-white h-full flex items-center justify-center text-3xl">
                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                      <h1 className="text-xl font-semibold">Connecting...</h1>
                    </div>
                  ) : (
                    <center className="w-full h-full">
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
                      />
                    </center>
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

            {/* Add Checkout Modal */}
            {showCheckoutModal && (
              <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Checkout Complete
                  </h2>
                  <div className="text-gray-300 text-lg mb-6">
                    <p className="mb-2">Your result:</p>
                    <p
                      className={`text-2xl font-bold ${
                        profit > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {profit.toFixed(8)} BTC
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setBettingStarted(false);
                      }}
                    >
                      Play Again
                    </button>
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
