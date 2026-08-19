/* eslint-disable */
import { useEffect, useState } from "react";
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
import BetCalculator from "./Chances";
import { toast } from "react-toastify";

import checkLoggedIn from "../../../utils/isloggedIn";
import { useNavigate } from "react-router-dom";
import {
  initializeSlideSocket,
  disconnectSlideSocket,
  placeBet,
  placeAutoBet,
  onGameState,
  onTimeUpdate,
  onRoundResult,
  onNewRound,
  onBetPlaced,
  onAutoBetStarted,
  onAutoBetUpdated,
  onAutoBetComplete,
  onError,
  onBetsUpdated,
  onBetResult,
  removeAllListeners,
} from "../../../socket/games/slide";
import { useSelector } from "react-redux";
import { requestWalletRefresh } from "../../../utils/walletEvents";

const DiceFrame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");
  const [timeLeft, setTimeLeft] = useState(15);
  const [bets, setBets] = useState(0);

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

  const [roll, setRoll] = useState("50.5");

  const [fixedPosition, setFixedPosition] = useState(roll);
  const [gameResult, setGameResult] = useState("");
  const [targetPosition, setTargetPosition] = useState(fixedPosition);
  const [dicePosition, setDicePosition] = useState(fixedPosition);

  const [TargetNumber, setTargetNumber] = useState(0);
  const [enteredMultipler, setenteredMultipler] = useState(0);
  const [gamestarted, setgamestarted] = useState(false);

  const [currentHistory, setCurrentHistory] = useState([]);
  const [winChance, setWinChance] = useState("50");
  const [startAutoBet, setStartAutoBet] = useState(false);

  const [targetMultiplier, setTargetMultiplier] = useState(null);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  useEffect(() => {
    initializeSlideSocket(token);

    onGameState((data) => {
      console.log("Game state update:", data);
      setgamestarted(!data.isWaiting);
      setTimeLeft(data.timeLeft);

      const formattedHistory = (data.roundResults || []).map((result) => ({
        id: result.round,
        value: result.multiplier,
        color: "#15803D",
      }));
      setCurrentHistory(formattedHistory);
      if (data.targetMultiplier) {
        setTargetMultiplier(data.targetMultiplier);
      }
    });

    onTimeUpdate((data) => {
      console.log("Time update:", data);
      setTimeLeft(data.timeLeft);
    });

    onRoundResult((data) => {
      console.log("Round result:", data);
      setGameResult(data.multiplier.toString());
      setTargetMultiplier(data.multiplier);

      const formattedHistory = (data.roundResults || []).map((result) => ({
        id: result.round,
        value: result.multiplier,
        color: "#15803D",
      }));
      setCurrentHistory(formattedHistory);
      setgamestarted(false);
    });

    onNewRound((data) => {
      console.log("New round:", data);
      setgamestarted(false);
      setTimeLeft(data.timeLeft);
      setGameResult("");
      setTargetMultiplier(null);
      setBets(0);
    });

    onBetPlaced((data) => {
      console.log("Bet placed:", data);
      toast.success(
        `Bet placed: ${data.betAmount} at ${data.targetMultiplier}x`
      );
      // Stake debited server-side; refresh the balance readout.
      requestWalletRefresh();
    });

    // Personal settlement for our bet: a win credited stake x multiplier,
    // a loss (bust) kept the stake debit. Either way, resync the balance.
    onBetResult((data) => {
      if (data.isWin) {
        toast.success(
          `You won! Payout ${Number(data.winAmount).toFixed(2)} at ${
            data.multiplier
          }x`
        );
      } else {
        toast.info(`Round landed on ${data.multiplier}x — bet lost`);
      }
      requestWalletRefresh();
    });

    onAutoBetStarted((data) => {
      console.log("Auto bet started:", data);
      setStartAutoBet(true);
      toast.info(`Auto bet started: ${data.totalBets} bets remaining`);
    });

    onAutoBetUpdated((data) => {
      console.log("Auto bet updated:", data);
      setNBets(data.remainingBets);
    });

    onAutoBetComplete(() => {
      console.log("Auto bet complete");
      setStartAutoBet(false);
      toast.success("Auto bet sequence completed");
    });

    onError((data) => {
      console.error("Game error:", data);
      toast.error(data.message);
      // A rejected bet (e.g. insufficient balance) left the wallet
      // untouched; resync the readout in case it drifted.
      requestWalletRefresh();
    });

    onBetsUpdated((data) => {
      console.log("Bets updated:", data);
      setBets(data.totalBets);
    });

    return () => {
      removeAllListeners();
      disconnectSlideSocket();
    };
  }, [token, navigate]);

  const handleBetClick = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (enteredMultipler > 1 && enteredMultipler < 51) {
      placeBet({
        betAmount: parseFloat(bet),
        targetMultiplier: parseFloat(enteredMultipler),
        walletType: "demo",
      });
    } else {
      toast.error("Enter a valid multiplier between 1 and 51");
    }
  };

  const handleAutoBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!startAutoBet && nbets > 0 && nbets <= 100) {
      placeAutoBet({
        betAmount: parseFloat(bet),
        targetMultiplier: parseFloat(enteredMultipler),
        numberOfBets: parseInt(nbets),
        walletType: "demo",
      });
    } else {
      toast.error("Enter a valid number of bets (1-100)");
    }
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

  return (
    <div
      className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px]"
      style={{ minHeight: "calc(100vh - 70px)" }}
    >
      <div
        className={`my-12 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
          theatreMode ? "max-w-[100%]" : "max-lg:max-w-[450px]"
        }`}
      >
        <div className="flex flex-col gap-[0.15rem] relative">
          <div className="grid grid-cols-12 lg:min-h-[600px]">
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
                enteredMultipler,
                setenteredMultipler,
                gamestarted,
              }}
            />

            <div
              className={`col-span-12 rounded-tr ${
                theatreMode
                  ? "md:col-span-8 md:order-2"
                  : "lg:col-span-8 lg:order-2"
              } xl:col-span-9 bg-gray-900 order-1 max-lg:min-h-[450px]`}
            >
              <div className="w-full px-5 relative text-white h-full items-center justify-center text-3xl">
                <History list={currentHistory} displayOrder="right-to-left" />
                <GameComponent
                  {...{
                    setTargetNumber: setTargetMultiplier,
                    gamestarted,
                    setgamestarted,
                    timeLeft,
                    bets,
                    targetMultiplier,
                  }}
                />
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
                  <FairnessModal setIsFairness={setIsFairness} />
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
