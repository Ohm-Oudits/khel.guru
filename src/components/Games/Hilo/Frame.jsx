import { useEffect, useState } from "react";
import "../../../styles/Frame.css";
import FairnessModal from "../../Frame/FairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import { GameResultModal, ActiveGameModal } from "./GameResultModal";
import SideBar from "./SideBar";
import Game from "./Game";
import { CARD_SUITS, CARD_VALUES } from "./constant";

import { useSelector } from "react-redux";
import {
  disconnectHiloSocket,
  getHiloSocket,
  initializeHiloSocket,
  getActiveGame,
  addGame,
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

  const [showResultModal, setShowResultModal] = useState(false);
  const [showActiveGameModal, setShowActiveGameModal] = useState(false);
  const [gameResult, setGameResult] = useState({
    isGameOver: false,
    profit: 0,
  });
  const [isWaitingForCard, setIsWaitingForCard] = useState(false);
  const [isGameStarting, setIsGameStarting] = useState(false);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  const [currentCard, setCurrentCard] = useState(null);
  const [historyCards, setHistoryCards] = useState([]);

  useEffect(() => {
    if (token) {
      initializeHiloSocket(token);
      getActiveGame((gameState) => {
        console.log("Active game state received:", gameState); // Debug log
        if (gameState) {
          if (gameState.gameOver) {
            console.log("Game is over, showing result modal"); // Debug log
            setGameResult({ isGameOver: true, profit: gameState.profit || 0 });
            setShowResultModal(true);
          } else {
            console.log("Active game found, showing active game modal"); // Debug log
            setShowActiveGameModal(true);
            // For existing games, we should have valid card data
            setCurrentCard(gameState.currentCard);
            setHistoryCards(gameState.historyCards || []);
            setBettingStarted(true);
          }
          setIsWaitingForCard(false);
        } else {
          console.log("No active game found"); // Debug log
        }
      });

      onGameOver(({ game }) => {
        console.log("Game over event received:", game); // Debug log
        // The round settled as a loss (stake kept): refresh the balance.
        requestWalletRefresh();
        setBettingStarted(false);
        setIsWaitingForCard(false);
        setGameResult({ isGameOver: true, profit: game.profit || 0 });
        setShowResultModal(true);
      });

      onError(({ message }) => {
        console.error("Socket error:", message); // Debug log
        // A rejected action left the wallet untouched; resync the readout.
        requestWalletRefresh();
        setIsWaitingForCard(false);
        toast.error(message);
      });
    }

    return () => {
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

    if (!bet || parseFloat(bet) <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    // Close any open modals
    setShowResultModal(false);
    setShowActiveGameModal(false);
    setGameResult({ isGameOver: false, profit: 0 });

    // Reset game state
    setCurrentCard(null);
    setHistoryCards([]);
    setIsGameStarting(true);
    setIsWaitingForCard(true);

    console.log("Starting new game with bet:", bet); // Debug log
    addGame(
      bet,
      (gameState) => {
        console.log("New game state received:", gameState); // Debug log

        if (!gameState) {
          console.error("No game state received from server");
          toast.error("Failed to start game. Please try again.");
          setIsWaitingForCard(false);
          setIsGameStarting(false);
          return;
        }

        // Check if we have an active game
        if (gameState.error) {
          console.error("Server error:", gameState.error);
          toast.error(gameState.error);
          setIsWaitingForCard(false);
          setIsGameStarting(false);
          return;
        }

        // The stake was just debited (new round): refresh the balance.
        requestWalletRefresh();

        // Set the game state
        setCurrentCard(gameState.currentCard);
        setHistoryCards([gameState.currentCard]);
        setBettingStarted(true);
        setIsWaitingForCard(false);
        setIsGameStarting(false);
      },
      "demo"
    );
  };

  const handleHigh = () => {
    if (betStarted) {
      setIsWaitingForCard(true);
      predict("high", (gameState) => {
        if (gameState) {
          setCurrentCard(gameState.currentCard);
          setHistoryCards(gameState.historyCards);
          setIsWaitingForCard(false);
        }
      });
    }
  };

  const handleLow = () => {
    if (betStarted) {
      setIsWaitingForCard(true);
      predict("low", (gameState) => {
        if (gameState) {
          setCurrentCard(gameState.currentCard);
          setHistoryCards(gameState.historyCards);
          setIsWaitingForCard(false);
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
        }
      });
    }
  };

  const handleCheckout = () => {
    if (betStarted) {
      setIsWaitingForCard(true);
      checkout((gameState) => {
        if (gameState.checkedOut) {
          // The cashout was just credited: refresh the balance.
          requestWalletRefresh();
          setBettingStarted(false);
          setGameResult({ isGameOver: false, profit: gameState.profit });
          setShowResultModal(true);
          setIsWaitingForCard(false);
        }
      });
    }
  };

  const handleContinueGame = () => {
    setShowActiveGameModal(false);
  };

  const handleCheckoutGame = () => {
    if (betStarted) {
      setIsWaitingForCard(true);
      checkout((gameState) => {
        if (gameState.checkedOut) {
          // The cashout was just credited: refresh the balance.
          requestWalletRefresh();
          setBettingStarted(false);
          setGameResult({ isGameOver: false, profit: gameState.profit });
          setShowResultModal(true);
          setIsWaitingForCard(false);
        }
      });
    }
    setShowActiveGameModal(false);
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
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr relative ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1`}
              >
                <div className="w-full text-white rounded-tr h-full justify-center text-3xl">
                  {loading ? (
                    <h1 className="text-xl font-semibold">Loading...</h1>
                  ) : (
                    <>
                      <Game
                        historyCards={historyCards}
                        currentCard={currentCard}
                        isGameStarting={isGameStarting}
                        isWaitingForCard={isWaitingForCard}
                      />
                      <GameResultModal
                        isOpen={showResultModal}
                        onClose={() => setShowResultModal(false)}
                        isGameOver={gameResult.isGameOver}
                        profit={gameResult.profit}
                      />
                      <ActiveGameModal
                        isOpen={showActiveGameModal}
                        onClose={() => setShowActiveGameModal(false)}
                        onContinue={handleContinueGame}
                        onCheckout={handleCheckoutGame}
                      />
                    </>
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
              <div
                className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                onClick={() => setIsFairness(false)}
              >
                <div className="text-white w-full flex items-center justify-center h-full">
                  <div
                    className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
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
