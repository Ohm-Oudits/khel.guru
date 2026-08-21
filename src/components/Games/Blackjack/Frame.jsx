import { useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import FrameFooter from "../../Frame/FrameFooter";
import SideBar from "./SideBar";
import Game from "./Game";
import { useSelector } from "react-redux";
import {
  getBlackjackSocket,
  initializeBlackjackSocket,
} from "../../../socket/games/blackjack";
import checkLoggedIn from "../../../utils/isloggedIn";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CardFairnessModal from "../../Frame/CardFairnessModal";
import { addToGameHistory } from "../../../utils/gameHistory";

const HISTORY_KEY = "blackjack_game_history";

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [bet, setBet] = useState("0.000000");
  const [betStarted, setBettingStarted] = useState(false);
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
  const [userCards, setUserCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [userValue, setUserValue] = useState(0);
  const [dealerValue, setDealerValue] = useState(0);
  const [userResult, setUserResult] = useState(null);
  const [split, setSplit] = useState(false);
  const [double, setDouble] = useState(false);
  const [splitHands, setSplitHands] = useState([]);
  const [activeHand, setActiveHand] = useState(0);
  const [splitValues, setSplitValues] = useState([0, 0]);
  const [splitResults, setSplitResults] = useState([null, null]);
  const [splitBets, setSplitBets] = useState(["0.000000", "0.000000"]);
  const [gameState, setGameState] = useState(null);
  const [fairnessPrefill, setFairnessPrefill] = useState(null);
  const [roundResetCountdown, setRoundResetCountdown] = useState(null);
  const [roundResetPending, setRoundResetPending] = useState(false);
  const lastSettledNonce = useRef(null);
  const roundResetTimeoutRef = useRef(null);
  const roundResetIntervalRef = useRef(null);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  const clearRoundResetTimers = () => {
    if (roundResetTimeoutRef.current) {
      clearTimeout(roundResetTimeoutRef.current);
      roundResetTimeoutRef.current = null;
    }

    if (roundResetIntervalRef.current) {
      clearInterval(roundResetIntervalRef.current);
      roundResetIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!token) return undefined;

    const socket = initializeBlackjackSocket(token);
    const onConnect = () => socket.emit("get_game_state");
    socket.on("connect", onConnect);
    if (socket.connected) {
      socket.emit("get_game_state");
    }

    return () => {
      socket.off("connect", onConnect);
    };
  }, [token]);

  useEffect(() => () => clearRoundResetTimers(), []);

  useEffect(() => {
    const blackjackSocket = getBlackjackSocket();
    if (!blackjackSocket) return undefined;

    const handleGameState = (data) => {
      const gameData = Array.isArray(data) ? data[0] : data;
      const { success, gameState: nextState } = gameData || {};
      if (!success || !nextState) return;

      setGameState(nextState);
      updateGameState(nextState);
      if (nextState.fairness) {
        setFairnessPrefill(nextState.fairness);
      }

      if (nextState.gameState === "complete" && nextState.settlement) {
        const nonce = nextState.nonce;
        if (nonce != null && lastSettledNonce.current !== nonce) {
          lastSettledNonce.current = nonce;
          const multiplier = Number(nextState.settlement.multiplier) || 0;
          addToGameHistory(HISTORY_KEY, {
            number: multiplier,
            isWin: multiplier > 1,
          });
        }
      }

      if (
        nextState.gameState === "complete" ||
        nextState.isSplit ||
        nextState.insuranceTaken
      ) {
        requestWalletRefresh();
      }
    };

    blackjackSocket.on("game_state", handleGameState);
    blackjackSocket.on("game_state_update", handleGameState);
    blackjackSocket.on("initial_game_state", handleGameState);

    blackjackSocket.on("error", (error) => {
      requestWalletRefresh();
      if (error.message && !/no active game/i.test(error.message)) {
        toast.error(error.message);
      }
    });

    return () => {
      blackjackSocket.off("game_state", handleGameState);
      blackjackSocket.off("game_state_update", handleGameState);
      blackjackSocket.off("initial_game_state", handleGameState);
      blackjackSocket.off("error");
    };
  }, [token]);

  const updateGameState = (next) => {
    if (!next) return;

    setUserCards(next.userCards || []);
    setDealerCards(next.dealerCards || []);
    setUserValue(next.userValue || 0);
    setDealerValue(next.dealerValue || 0);
    setUserResult(next.result || null);

    const inRound = ["playing", "insurance", "dealer"].includes(next.gameState);
    setBettingStarted(inRound);

    if (next.bet !== undefined) {
      setBet(String(next.bet));
    }

    setDouble(Boolean(next.userCards?.length === 2 && !next.isSplit && next.gameState === "playing"));

    if (next.isSplit) {
      setSplit(true);
      setSplitHands(next.splitHands || [[], []]);
      setSplitValues(next.splitValues || [0, 0]);
      setSplitResults(next.splitResults || [null, null]);
      setSplitBets((next.splitBets || [0, 0]).map((value) => String(value)));
      setActiveHand(next.activeHand || 0);
    } else {
      setSplit(false);
      setSplitHands([]);
      setSplitValues([0, 0]);
      setSplitResults([null, null]);
      setSplitBets(["0.000000", "0.000000"]);
      setActiveHand(0);
    }
  };

  const playing = gameState?.gameState === "playing";
  const insuranceOpen = gameState?.gameState === "insurance";
  const betLocked = roundResetCountdown !== null || roundResetPending;

  useEffect(() => {
    if (gameState?.gameState !== "complete") {
      clearRoundResetTimers();
      setRoundResetCountdown(null);
      return undefined;
    }

    clearRoundResetTimers();
    setRoundResetCountdown(3);

    roundResetIntervalRef.current = setInterval(() => {
      setRoundResetCountdown((prev) =>
        prev != null && prev > 1 ? prev - 1 : 1
      );
    }, 1000);

    roundResetTimeoutRef.current = setTimeout(async () => {
      const blackjackSocket = getBlackjackSocket();

      clearRoundResetTimers();
      setRoundResetCountdown(null);

      if (!blackjackSocket) {
        toast.error("Failed to reset game: Check Your Internet Connection");
        return;
      }

      setRoundResetPending(true);

      try {
        await new Promise((resolve, reject) => {
          const handleResetState = ({ success, gameState: nextState }) => {
            cleanup();
            if (success && nextState) {
              resolve(nextState);
              return;
            }
            reject(new Error("Failed to reset round"));
          };

          const handleResetError = (error) => {
            cleanup();
            reject(error);
          };

          const cleanup = () => {
            blackjackSocket.off("game_state", handleResetState);
            blackjackSocket.off("error", handleResetError);
          };

          blackjackSocket.on("game_state", handleResetState);
          blackjackSocket.on("error", handleResetError);
          blackjackSocket.emit("add_game");
        });
      } catch (error) {
        toast.error(error.message || "Failed to reset round");
      } finally {
        setRoundResetPending(false);
      }
    }, 3000);

    return () => clearRoundResetTimers();
  }, [gameState?.gameState, gameState?.nonce]);

  const handlePlaceBet = async () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (betLocked) return;

    const blackjackSocket = getBlackjackSocket();
    if (!blackjackSocket) {
      toast.error("Failed to join game: Check Your Internet Connection");
      return;
    }

    try {
      if (!betStarted && gameState?.gameState !== "betting") {
        await new Promise((resolve, reject) => {
          blackjackSocket.emit("add_game");
          blackjackSocket.once("game_state", ({ success, gameState: next }) => {
            if (success && next) {
              updateGameState(next);
              resolve(next);
            } else {
              reject(new Error("Failed to create game"));
            }
          });
          blackjackSocket.once("error", (error) => reject(error));
        });
      }

      await new Promise((resolve, reject) => {
        blackjackSocket.emit("place_bet", {
          betAmount: parseFloat(bet),
          walletType: "demo",
        });
        blackjackSocket.once("game_state", ({ success, gameState: next }) => {
          if (success && next) {
            updateGameState(next);
            resolve(next);
          } else {
            reject(new Error("Failed to place bet"));
          }
        });
        blackjackSocket.once("error", (error) => reject(error));
      });

      requestWalletRefresh();
    } catch (error) {
      toast.error(error.message || "Failed to place bet");
      requestWalletRefresh();
    }
  };

  const emitAction = (event, payload) => {
    const blackjackSocket = getBlackjackSocket();
    if (!blackjackSocket) return;
    if (payload !== undefined) {
      blackjackSocket.emit(event, payload);
    } else {
      blackjackSocket.emit(event);
    }
  };

  const handleHit = () => {
    if (playing) emitAction("hit");
  };

  const handleStand = () => {
    if (playing) emitAction("stand");
  };

  const handleSplit = () => {
    if (
      playing &&
      userCards.length === 2 &&
      userCards[0].value === userCards[1].value
    ) {
      emitAction("split");
    }
  };

  const handleDouble = () => {
    if (playing && userCards.length === 2 && !split) {
      emitAction("double");
    }
  };

  const handleInsurance = (take) => {
    if (insuranceOpen) emitAction("insurance", { take });
  };

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-4"
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
            <div className="grid grid-cols-12 lg:min-h-[600px]">
              <SideBar
                theatreMode={theatreMode}
                setBetMode={setBetMode}
                betMode={betMode}
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                handleMineBet={handlePlaceBet}
                bettingStarted={betStarted}
                betLocked={betLocked}
                betButtonLabel={
                  roundResetCountdown !== null
                    ? `Next round in ${roundResetCountdown}s`
                    : roundResetPending
                      ? "Resetting..."
                      : "Place Bet"
                }
                playing={playing}
                insuranceOpen={insuranceOpen}
                split={split}
                double={double}
                handleDouble={handleDouble}
                handleHit={handleHit}
                handleSplit={handleSplit}
                handleStand={handleStand}
                handleInsurance={handleInsurance}
                activeHand={activeHand}
                splitHands={splitHands}
                splitValues={splitValues}
                splitResults={splitResults}
                splitBets={splitBets}
                userCards={userCards}
              />

              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1 max-lg:h-auto`}
              >
                <div className="relative flex h-full w-full flex-col text-white max-lg:min-h-0 lg:min-h-[520px]">
                  <Game
                    userCards={split ? splitHands[activeHand] : userCards}
                    dealerCards={dealerCards}
                    userValue={split ? splitValues[activeHand] : userValue}
                    dealerValue={dealerValue}
                    userResult={split ? splitResults[activeHand] : userResult}
                    isSplit={split}
                    activeHand={activeHand}
                    splitHands={splitHands}
                    splitValues={splitValues}
                    splitResults={splitResults}
                    settlement={gameState?.settlement}
                    phase={gameState?.gameState}
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
          </div>
        </div>
      </div>
      {isFairness && (
        <div
          className="fixed top-0 left-0 z-[20] flex h-full w-full cursor-pointer items-center justify-center bg-[rgba(0,0,0,0.4)]"
          onClick={() => setIsFairness(false)}
        >
          <div
            className="custom-scrollbar max-h-[90%] w-[95%] max-w-[500px] overflow-y-auto rounded bg-primary pt-3"
            onClick={(event) => event.stopPropagation()}
          >
            <CardFairnessModal
              setIsFairness={setIsFairness}
              gameKey="blackjack"
              prefill={fairnessPrefill}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Frame;
