/* eslint-disable */
import { useEffect, useRef, useState } from "react";
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
  disconnectPumpSocket,
  getPumpSocket,
  initializePumpSocket,
  placePumpBet,
  cashOutPump,
  bustPump,
} from "../../../socket/games/pump";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";

const Frame = () => {
  // main states
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");

  const [start, setStart] = useState(false);

  const [Multipler, setMultipler] = useState(2.0);
  const [EstProfit, setEstProfit] = useState("0.000000");
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
  const [defaultColor, setDefaultColor] = useState(true);
  const [betCompleted, setBetCompleted] = useState(false);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [startAutoBet, setStartAutoBet] = useState(false);
  const [risk, setrisk] = useState("Low");

  const [balloonNumber, setBalloonNumber] = useState(1.01);
  const [pumpedNumber, setpumpedNumber] = useState(0);
  const [balloonSize, setBalloonSize] = useState(50);
  const [isPopped, setIsPopped] = useState(false);
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

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  // True while a stake is committed to the running round and not yet
  // settled (cashed out / popped / rejected). Guards against emitting a
  // second debit or a second settlement for the same round.
  const activeBetRef = useRef(false);

  // Attach wallet settlement listeners once per socket instance.
  const attachWalletHandlers = () => {
    const pumpSocket = getPumpSocket();
    if (!pumpSocket || pumpSocket.__walletHandlersBound) return;
    pumpSocket.__walletHandlersBound = true;

    pumpSocket.on("bet_placed", () => {
      // Stake debited server-side; refresh the balance readout.
      requestWalletRefresh();
    });

    pumpSocket.on("cashout_success", ({ payout, multiplier }) => {
      activeBetRef.current = false;
      toast.success(
        `Cashed out at ${Number(multiplier).toFixed(2)}x for ${Number(
          payout
        ).toFixed(2)}`
      );
      requestWalletRefresh();
    });

    pumpSocket.on("bet_busted", () => {
      activeBetRef.current = false;
      requestWalletRefresh();
    });

    pumpSocket.on("error", ({ message }) => {
      // A rejected bet (e.g. insufficient balance) left no stake in the
      // round; reset the bet state and resync the balance readout.
      toast.error(message);
      activeBetRef.current = false;
      setBettingStarted(false);
      requestWalletRefresh();
    });
  };

  const initSocket = () => {
    const pumpSocket = getPumpSocket();
    if (!pumpSocket) {
      initializePumpSocket(token);
    }
    attachWalletHandlers();
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const pumpSocket = getPumpSocket();

      if (pumpSocket) {
        pumpSocket.on("error", ({ message }) => {
          console.error("Join game error:", message);
          toast.error(`Error joining game: ${message}`);
        });
      }
    }

    return () => {
      const pumpSocket = getPumpSocket();
      if (pumpSocket) {
        pumpSocket.off("error");
      }
      disconnectPumpSocket();
    };
  }, []);

  const startGame = () => {
    const pumpSocket = getPumpSocket();
    if (pumpSocket) {
      pumpSocket.emit("add_game", {});
      console.log("Emitted add_game event");
    } else {
      console.error("Pump socket not initialized");
      toast.error("Failed to join game: Socket not connected");
      return;
    }

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

    initSocket();

    const betAmount = parseFloat(bet);
    if (!betAmount || betAmount <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    if (activeBetRef.current) {
      return;
    }

    // Commit the stake for this round exactly once (demo wallet).
    if (!placePumpBet(betAmount, "demo")) {
      toast.error("Failed to place bet. Please try again.");
      return;
    }
    activeBetRef.current = true;

    setBettingStarted(true);
    startGame();
  };

  const handleAutoBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    initSocket();
    if (!startAutoBet && nbets > 0) {
      setStartAutoBet(true);
      autoBet(nbets);
    }
  };

  const handlePump = () => {
    setpumpedNumber((prev) => prev + 1);
  };

  const handleCheckout = () => {
    // Capture the cashout multiplier before the balloon resets.
    const cashoutMultiplier = Number(balloonNumber);

    // Cash out the committed stake exactly once (server credits
    // stake x multiplier and rejects a second attempt).
    if (activeBetRef.current) {
      activeBetRef.current = false;
      cashOutPump(cashoutMultiplier);
    }

    setBalloonNumber(1.01);
    setCurrentHistory((prev) => [
      ...prev,
      {
        result: cashoutMultiplier,
        color: "green",
      },
    ]);
    setBettingStarted(false);
  };

  const autoBet = (remainingBets) => {
    if (remainingBets > 0) {
      startGame();
      const gameDuration = 1500 + 500;
      setTimeout(() => {
        autoBet(remainingBets - 1);
      }, gameDuration);
    } else {
      setStartAutoBet(false);
    }
  };

  // The balloon popped with our stake still in play: forfeit it (bust).
  useEffect(() => {
    if (isPopped && activeBetRef.current) {
      activeBetRef.current = false;
      bustPump();
      requestWalletRefresh();
    }
  }, [isPopped]);

  const [number, setNumber] = useState(null);
  const [finalNumber, setFinalNumber] = useState(null);
  const [targetMultiplier, setTargetMultiplier] = useState(1.01);

  useEffect(() => {
    if (betCompleted) {
      const newHistoryItem = {
        id: currentHistory.length + 1,
        value: finalNumber,
        color: finalNumber > targetMultiplier ? "#15803D" : "#B91C1C",
      };

      setCurrentHistory([...currentHistory, newHistoryItem]);
      setBetCompleted(false);
    }
  }, [betCompleted]);

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
                handlePump={handlePump}
                handleCheckout={handleCheckout}
                risk={risk}
                setRisk={setrisk}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1 max-lg:min-h-[470px]`}
              >
                <div className="w-full px-4 relative text-white h-full  items-center justify-center text-3xl">
                  <History list={currentHistory} />
                  <GameComponent
                    Multipler={Multipler}
                    number={number}
                    finalNumber={finalNumber}
                    pumpClicked={pumpedNumber}
                    setBettingStarted={setBettingStarted}
                    balloonNumber={balloonNumber}
                    setBalloonNumber={setBalloonNumber}
                    history={currentHistory}
                    balloonSize={balloonSize}
                    setBalloonSize={setBalloonSize}
                    bettingStarted={bettingStarted}
                    isPopped={isPopped}
                    setIsPopped={setIsPopped}
                    targetMultiplier={targetMultiplier}
                    setTargetMultiplier={setTargetMultiplier}
                    setCurrenthistory={setCurrentHistory}
                    risk={risk}
                    pumpMultipler={pumpMultipler}
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
