/* eslint-disable */
import { useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import FairnessModal from "../../Frame/FairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import Game from "./Game";
import SideBar from "./Sidebar";
import History from "../../Frame/History";

import { useSelector } from "react-redux";
import {
  getCrashSocket,
  initializeCrashSocket,
  placeCrashBet,
  cashOutCrash,
  bustCrash,
} from "../../../socket/games/crash";
import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";

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

  const [bettingStarted, setBettingStarted] = useState(false);
  const [startAutoBet, setStartAutoBet] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [disableBet, setDisableBet] = useState(false);
  const [value, setValue] = useState(1.0);
  const [autoMultipyTarget, setAutoMultipyTarget] = useState("1.01");

  const token = useSelector((state) => state.auth?.token);

  // True while a stake is committed to the running round and not yet
  // settled (cashed out / busted / rejected). Guards against emitting a
  // second debit or a second settlement for the same round.
  const activeBetRef = useRef(false);

  // Attach wallet settlement listeners once per socket instance.
  const attachWalletHandlers = () => {
    const crashSocket = getCrashSocket();
    if (!crashSocket || crashSocket.__walletHandlersBound) return;
    crashSocket.__walletHandlersBound = true;

    crashSocket.on("bet_placed", () => {
      // Stake debited server-side; refresh the balance readout.
      requestWalletRefresh();
    });

    crashSocket.on("cashout_success", ({ payout, multiplier }) => {
      activeBetRef.current = false;
      toast.success(
        `Cashed out at ${Number(multiplier).toFixed(2)}x for ${Number(
          payout
        ).toFixed(2)}`
      );
      requestWalletRefresh();
    });

    crashSocket.on("bet_busted", () => {
      activeBetRef.current = false;
      requestWalletRefresh();
    });

    crashSocket.on("error", ({ message }) => {
      // A rejected bet (e.g. insufficient balance) left no stake in the
      // round; reset the bet state and resync the balance readout.
      toast.error(message);
      activeBetRef.current = false;
      setBettingStarted(false);
      requestWalletRefresh();
    });
  };

  const initSocket = () => {
    const wheelSocket = getCrashSocket();
    if (!wheelSocket) {
      initializeCrashSocket(token);
    }
    attachWalletHandlers();
  };

  const navigate = useNavigate();
  const handleBetClick = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    initSocket();

    const crashSocket = getCrashSocket();
    if (crashSocket) {
      crashSocket.emit("add_game", {});
      console.log("Emitted add_game event");
    } else {
      console.error("Wheel socket not initialized");
      toast.error("Failed to join game: Socket not connected");
      return;
    }

    if (!disableBet && !activeBetRef.current) {
      const betAmount = parseFloat(bet);
      if (!betAmount || betAmount <= 0) {
        toast.error("Please enter a valid bet amount");
        return;
      }

      // Commit the stake for this round exactly once (demo wallet).
      if (placeCrashBet(betAmount, "demo")) {
        activeBetRef.current = true;
        setBettingStarted(true);
        setCheckout(false);
      }
    }
  };

  const handleCheckout = () => {
    // Cash out the committed stake at the current multiplier exactly once.
    if (activeBetRef.current) {
      activeBetRef.current = false;
      cashOutCrash(parseFloat(value.toFixed(2)));
    }
    setCheckout(true);
    setBettingStarted(false);
  };

  // The round crashed with our (manual) bet still in play: forfeit it.
  const handleRoundCrashed = () => {
    if (activeBetRef.current) {
      activeBetRef.current = false;
      bustCrash();
      requestWalletRefresh();
    }
  };

  // Auto-bet: commit a stake at the start of each auto round.
  const handleAutoRoundStart = () => {
    if (activeBetRef.current) return;
    const betAmount = parseFloat(bet);
    if (!betAmount || betAmount <= 0) return;
    if (placeCrashBet(betAmount, "demo")) {
      activeBetRef.current = true;
    }
  };

  // Auto-bet: the crash multiplier passed the target, so the auto cashout
  // fired at the target multiplier before the crash.
  const handleAutoCashout = (targetMultiplier) => {
    if (activeBetRef.current) {
      activeBetRef.current = false;
      cashOutCrash(parseFloat(targetMultiplier));
    }
  };

  const history = [
    { id: 1, value: "1.64", color: "#f7b32b" },
    { id: 2, value: "0.04", color: "#28a745" },
    { id: 3, value: "1.24", color: "#f7b32b" },
    { id: 4, value: "21.64", color: "#5b34eb" },
    { id: 5, value: "2.94", color: "#f7b32b" },
    { id: 6, value: "0.64", color: "#28a745" },
  ];

  const handleAutoBet = () => {
    if (
      !startAutoBet &&
      nbets != 0 &&
      autoMultipyTarget >= 1.01 &&
      !disableBet
    ) {
      if (!checkLoggedIn()) {
        navigate(`?tab=${"login"}`, { replace: true });
        return;
      }

      initSocket();

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
          className={`my-12 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
            theatreMode ? "max-w-[100%] max-h-screen" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative">
            <div className="grid grid-cols-12 lg:h-[600px]">
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
                loss={loss}
                setOnLoss={setOnLoss}
                setOnWin={setOnWin}
                onLoss={onLoss}
                onWin={onWin}
                onWinReset={onWinReset}
                onLossReset={onLossReset}
                setOnLossReset={setOnLossReset}
                setOnWinReset={setOnWinReset}
                bettingStarted={bettingStarted}
                setBettingStarted={setBettingStarted}
                handleBetClick={handleBetClick}
                handleCheckout={handleCheckout}
                value={value}
                disableBet={disableBet}
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
                } xl:col-span-9 bg-gray-900 order-1`}
              >
                <div className="w-full relative text-white h-full flex items-center justify-center text-3xl">
                  <div className="absolute top-2 left-0 z-10 w-full">
                    <History list={history} />
                  </div>
                  <Game
                    multiplier={value}
                    setMultiplier={setValue}
                    setBettingStarted={setBettingStarted}
                    setDisableBet={setDisableBet}
                    autoMultipyTarget={autoMultipyTarget}
                    startAutoBet={startAutoBet}
                    setStartAutoBet={setStartAutoBet}
                    nbets={nbets}
                    onRoundCrashed={handleRoundCrashed}
                    onAutoRoundStart={handleAutoRoundStart}
                    onAutoCashout={handleAutoCashout}
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
