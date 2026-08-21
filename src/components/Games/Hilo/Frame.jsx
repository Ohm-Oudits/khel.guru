import { useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import CardFairnessModal from "../../Frame/CardFairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";

import { useSelector } from "react-redux";
import {
  disconnectHiloSocket,
  getHiloSocket,
  initializeHiloSocket,
  getActiveGame,
  addGame,
  shufflePreview,
  predict,
  skip,
  checkout,
  onGameOver,
  onError,
  removeGameOverListener,
  removeErrorListener,
} from "../../../socket/games/hilo";
import checkLoggedIn from "../../../utils/isloggedIn";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [bet, setBet] = useState("0.000000");
  const [betStarted, setBettingStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [reset, setReset] = useState(false);

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
  const [isWaitingForCard, setIsWaitingForCard] = useState(false);
  const [isGameStarting, setIsGameStarting] = useState(false);
  const [roundMultiplier, setRoundMultiplier] = useState(1);
  const [settledMultiplier, setSettledMultiplier] = useState(null);
  const [betLocked, setBetLocked] = useState(false);
  const resetTimerRef = useRef(null);

  const [fairnessPrefill, setFairnessPrefill] = useState(null);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  const [currentCard, setCurrentCard] = useState(null);
  const [historyCards, setHistoryCards] = useState([]);

  const clearResetTimer = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const applyPreview = (game) => {
    if (!game?.currentCard) return false;
    setCurrentCard(game.currentCard);
    setHistoryCards(
      game.historyCards?.length ? game.historyCards : [game.currentCard]
    );
    setBettingStarted(false);
    if (game.fairness) setFairnessPrefill(game.fairness);
    return true;
  };

  const applyRound = (game) => {
    if (!game?.currentCard || game.gameOver || game.checkedOut) return false;
    clearResetTimer();
    setBetLocked(false);
    setCurrentCard(game.currentCard);
    setHistoryCards(
      game.historyCards?.length ? game.historyCards : [game.currentCard]
    );
    setBettingStarted(true);
    setSettledMultiplier(null);
    setRoundMultiplier(Number(game.multiplier) || 1);
    if (game.betAmount != null && game.stakeLocked !== false) {
      setBet(String(game.betAmount));
    }
    if (game.fairness) setFairnessPrefill(game.fairness);
    return true;
  };

  const ensurePreview = () => {
    shufflePreview((payload) => {
      if (payload?.game?.currentCard && payload.game.stakeLocked === false) {
        applyPreview(payload.game);
      }
    });
  };

  const hydrateGame = (game) => {
    if (!game || game.gameOver || game.checkedOut) {
      ensurePreview();
      return;
    }
    if (game.stakeLocked === false) {
      applyPreview(game);
      return;
    }
    applyRound(game);
  };

  const settleRound = (multiplier, game) => {
    if (game?.currentCard) setCurrentCard(game.currentCard);
    if (game?.historyCards?.length) setHistoryCards(game.historyCards);
    setBettingStarted(false);
    setIsWaitingForCard(false);
    setIsGameStarting(false);
    setRoundMultiplier(Number(multiplier) || 0);
    setSettledMultiplier(Number(multiplier) || 0);
    setBetLocked(true);
    clearResetTimer();
    resetTimerRef.current = setTimeout(() => {
      setBetLocked(false);
      setSettledMultiplier(null);
      setRoundMultiplier(1);
      ensurePreview();
      resetTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    if (token) {
      initializeHiloSocket(token);
      getActiveGame((payload) => {
        hydrateGame(payload?.game);
      });

      onGameOver(({ game }) => {
        requestWalletRefresh();
        settleRound(0, game);
      });

      onError(({ message }) => {
        requestWalletRefresh();
        setIsWaitingForCard(false);
        setIsGameStarting(false);
        toast.error(message);
      });
    }

    return () => {
      clearResetTimer();
      removeGameOverListener();
      removeErrorListener();
      disconnectHiloSocket();
    };
  }, [token]);

  const handleBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (betLocked) return;

    // Allow a 0 bet (testing); reject only an empty/NaN or negative amount.
    const parsedBet = parseFloat(bet);
    if (isNaN(parsedBet) || parsedBet < 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    setSettledMultiplier(null);

    setIsGameStarting(true);
    setIsWaitingForCard(true);

    addGame(
      bet,
      (gameState) => {
        if (!gameState) {
          toast.error("Failed to start game. Please try again.");
          setIsWaitingForCard(false);
          setIsGameStarting(false);
          return;
        }

        if (gameState.error) {
          toast.error(gameState.error);
          setIsWaitingForCard(false);
          setIsGameStarting(false);
          return;
        }

        applyRound(gameState);
        if (!gameState.hasActiveGame) {
          requestWalletRefresh();
        }
        setIsWaitingForCard(false);
        setIsGameStarting(false);
      },
      "demo"
    );
  };

  const handleShufflePreview = (done) => {
    if (betStarted || betLocked || settledMultiplier != null) {
      done?.(null);
      return;
    }
    if (!checkLoggedIn()) {
      done?.(null);
      return;
    }
    shufflePreview((payload) => {
      if (!payload?.game?.currentCard) {
        done?.(null);
        return;
      }
      applyPreview(payload.game);
      done?.(payload.game.currentCard);
    });
  };

  const handleHigh = () => {
    if (betStarted) {
      setIsWaitingForCard(true);
      predict("high", (gameState) => {
        if (!gameState) return;
        setCurrentCard(gameState.currentCard);
        setHistoryCards(gameState.historyCards);
        setIsWaitingForCard(false);
        if (gameState.fairness) setFairnessPrefill(gameState.fairness);
        if (gameState.gameOver) {
          settleRound(0, gameState);
          requestWalletRefresh();
        } else if (gameState.multiplier != null) {
          setRoundMultiplier(Number(gameState.multiplier));
        }
      });
    }
  };

  const handleLow = () => {
    if (betStarted) {
      setIsWaitingForCard(true);
      predict("low", (gameState) => {
        if (!gameState) return;
        setCurrentCard(gameState.currentCard);
        setHistoryCards(gameState.historyCards);
        setIsWaitingForCard(false);
        if (gameState.fairness) setFairnessPrefill(gameState.fairness);
        if (gameState.gameOver) {
          settleRound(0, gameState);
          requestWalletRefresh();
        } else if (gameState.multiplier != null) {
          setRoundMultiplier(Number(gameState.multiplier));
        }
      });
    }
  };

  const handleSkip = () => {
    if (betStarted) {
      setIsWaitingForCard(true);
      skip((gameState) => {
        if (gameState) {
          setCurrentCard(gameState.currentCard);
          setHistoryCards(gameState.historyCards);
          setIsWaitingForCard(false);
          if (gameState.fairness) setFairnessPrefill(gameState.fairness);
        }
      });
    }
  };

  const handleCheckout = () => {
    if (betStarted) {
      setIsWaitingForCard(true);
      checkout((gameState) => {
        if (gameState.checkedOut) {
          requestWalletRefresh();
          settleRound(gameState.multiplier, gameState);
        }
      });
    }
  };

  return (
    <>
      <div className="w-full bg-secondry pt-[1px] pb-3">
        <div
          className={`mx-auto my-3 flex w-[98%] flex-col overflow-hidden rounded bg-primary max-w-[1400px] max-md:my-0 max-md:w-full max-md:rounded-none ${
            theatreMode ? "max-w-full" : ""
          }`}
        >
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 grid-cols-12 md:min-h-[520px]">
              {/* Left Section */}
              <SideBar
                theatreMode={theatreMode}
                setBetMode={setBetMode}
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                setBettingStarted={setBettingStarted}
                handleBet={handleBet}
                bettingStarted={betStarted}
                setReset={setReset}
                handleHigh={handleHigh}
                handleLow={handleLow}
                handleSkip={handleSkip}
                handleCheckout={handleCheckout}
                currentCard={currentCard}
                roundMultiplier={roundMultiplier}
                betLocked={
                  betLocked || Boolean(token && !currentCard && !betStarted)
                }
              />

              {/* Right Section */}
              <div className="relative order-1 col-span-12 bg-[#0f212e] md:order-2 md:col-span-8 md:min-h-[520px] xl:col-span-9">
                <div className="relative flex h-full w-full items-stretch text-white">
                  {loading ? (
                    <h1 className="text-xl font-semibold">Loading...</h1>
                  ) : (
                    <>
                      <Game
                        historyCards={historyCards}
                        currentCard={currentCard}
                        isGameStarting={isGameStarting}
                        bettingStarted={betStarted}
                        settledMultiplier={settledMultiplier}
                        onShufflePreview={handleShufflePreview}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[#1a2c38] [&>div]:max-md:!py-3">
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

            {isGameSettings && (
              <div
                className="absolute bg-transparent top-0 left-0 w-full h-full z-[2] cursor-pointer"
                onClick={() => setIsGamings(false)}
              ></div>
            )}

            {/* Fairness Modal */}
            {isFairness && (
              <div
                className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                onClick={() => setIsFairness(false)}
              >
                <div className="text-white w-full flex items-center justify-center h-full">
                  <div
                    className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                      <CardFairnessModal
                        setIsFairness={setIsFairness}
                        gameKey="hilo"
                        prefill={fairnessPrefill}
                      />
                  </div>
                </div>
              </div>
            )}

            {hotkeys && (
              <div
                className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                onClick={() => setHotkeys(false)}
              >
                <div className="text-white w-full flex items-center justify-center h-full">
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
            )}

            {gameInfo && (
              <div
                className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                onClick={() => setGameInfo(false)}
              >
                <div className="text-white w-full flex items-center justify-center h-full">
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
                <div className="text-white w-full flex items-center justify-center h-full">
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
