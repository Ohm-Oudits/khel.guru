import { useEffect, useState } from "react";
import "../../../styles/Frame.css";
import FrameFooter from "../../Frame/FrameFooter";
import SideBar from "./SideBar";
import Game from "./Game";
import { CARD_SUITS, CARD_VALUES, getCardValue } from "./constant";

import { useSelector } from "react-redux";
import {
  disconnectBlackjackSocket,
  getBlackjackSocket,
  initializeBlackjackSocket,
} from "../../../socket/games/blackjack";
import checkLoggedIn from "../../../utils/isloggedIn";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
  const [dealerResult, setDealerResult] = useState(null);
  const [split, setSplit] = useState(false);
  const [double, setDouble] = useState(false);

  const [splitHands, setSplitHands] = useState([]);
  const [activeHand, setActiveHand] = useState(0);
  const [splitValues, setSplitValues] = useState([0, 0]);
  const [splitResults, setSplitResults] = useState([null, null]);
  const [splitBets, setSplitBets] = useState(["0.000000", "0.000000"]);

  const [cards, setCards] = useState([]);
  const [isSmt, setIsSmt] = useState(true);

  const [gameState, setGameState] = useState(null);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  useEffect(() => {
    console.log("Frame component mounted");

    if (!token) {
      console.log("No token available, skipping socket initialization");
      return;
    }

    console.log("Initializing socket with token");
    const socket = initializeBlackjackSocket(token);

    if (socket) {
      console.log("Socket initialized, will request game state on connect");
    } else {
      console.error("Failed to initialize socket");
    }

    return () => {
      console.log("Cleaning up socket initialization");
      const socket = getBlackjackSocket();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token]);

  useEffect(() => {
    console.log("Setting up socket event listeners");
    const blackjackSocket = getBlackjackSocket();

    if (!blackjackSocket) {
      console.log("No socket available for event listeners");
      return;
    }

    blackjackSocket.onAny((eventName, ...args) => {
      console.log("Socket event received:", eventName, args);
    });

    // Handle game state events (both initial and updates)
    const handleGameState = (data) => {
      console.log("Processing game state data:", data);
      const gameData = Array.isArray(data) ? data[0] : data;
      const { success, gameState: newGameState } = gameData;

      if (!success) {
        console.error("Game state request failed:", gameData);
        return;
      }

      if (!newGameState) {
        console.error("No game state in response:", gameData);
        return;
      }

      // Update the game state
      setGameState(newGameState);
      updateGameState(newGameState);

      // A completed round just settled (win credited / push refunded /
      // loss kept), and split/double hands carry an extra debit: refresh
      // the balance readout.
      if (newGameState.gameState === "complete" || newGameState.isSplit) {
        requestWalletRefresh();
      }
    };

    // Listen for both game_state and game_state_update events
    blackjackSocket.on("game_state", handleGameState);
    blackjackSocket.on("game_state_update", handleGameState);

    blackjackSocket.on("error", (error) => {
      console.error("Socket error received:", error);
      // A rejected action left the wallet untouched; resync the readout.
      requestWalletRefresh();
      // "No active game found" is the normal empty state on load, not an error.
      if (error.message && !/no active game/i.test(error.message)) {
        toast.error(error.message);
      }
    });

    blackjackSocket.on("connect", () => {
      console.log("Socket connected, requesting initial game state");
      blackjackSocket.emit("get_game_state");
    });

    blackjackSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      console.log("Cleaning up socket event listeners");
      if (blackjackSocket) {
        blackjackSocket.offAny();
        blackjackSocket.off("game_state");
        blackjackSocket.off("game_state_update");
        blackjackSocket.off("error");
        blackjackSocket.off("connect");
        blackjackSocket.off("disconnect");
      }
    };
  }, []);

  const updateGameState = (gameState) => {
    if (!gameState) return;

    console.log("Updating game state with:", gameState);

    // Update basic game state
    setUserCards(gameState.userCards || []);
    setDealerCards(gameState.dealerCards || []);
    setUserValue(gameState.userValue || 0);
    setDealerValue(gameState.dealerValue || 0);
    setUserResult(gameState.result || null);

    // Update betting state based on game state
    const isPlaying =
      gameState.gameState === "playing" || gameState.gameState === "dealer";
    setBettingStarted(isPlaying);
    setIsSmt(gameState.gameState === "playing");

    // Update bet amount if it exists
    if (gameState.bet !== undefined) {
      const betAmount = gameState.bet.toString();
      console.log("Setting bet amount to:", betAmount);
      setBet(betAmount);
    }

    // Handle split state
    if (gameState.isSplit) {
      setSplit(true);
      setSplitHands(gameState.splitHands || [[], []]);
      setSplitValues(gameState.splitValues || [0, 0]);
      setSplitResults(gameState.splitResults || [null, null]);
      setSplitBets(
        (gameState.splitBets || [0, 0]).map((bet) => bet.toString())
      );
      setActiveHand(gameState.activeHand || 0);
    } else {
      setSplit(false);
      setSplitHands([]);
      setSplitValues([0, 0]);
      setSplitResults([null, null]);
      setSplitBets(["0.000000", "0.000000"]);
      setActiveHand(0);
    }

    // Log the updated state
    console.log("Game state updated:", {
      gameState: gameState.gameState,
      bettingStarted: isPlaying,
      bet: gameState.bet,
      userCards: gameState.userCards?.length || 0,
      dealerCards: gameState.dealerCards?.length || 0,
      isSplit: gameState.isSplit,
    });
  };

  const createDeck = () => {
    let deck = [];

    for (let suit of CARD_SUITS) {
      for (let value of CARD_VALUES) {
        deck.push({
          suit,
          value,
          id: `${suit}-${value}`,
          rand: Math.floor(Math.random() * 20) + 1,
          flipped: true,
        });
      }
    }

    for (let i = deck.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  const [deck, setDeck] = useState(createDeck());

  const handlePlaceBet = async () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    const blackjackSocket = getBlackjackSocket();
    if (!blackjackSocket) {
      console.error("No socket available for placing bet");
      toast.error("Failed to join game: Check Your Internet Connection");
      return;
    }

    try {
      // Only create a new game if we're not already in one
      if (!betStarted && gameState?.gameState !== "betting") {
        console.log("Creating new game");
        await new Promise((resolve, reject) => {
          blackjackSocket.emit("add_game");
          blackjackSocket.once("game_state", ({ success, gameState }) => {
            if (success && gameState) {
              updateGameState(gameState);
              resolve(gameState);
            } else {
              reject(new Error("Failed to create game"));
            }
          });
          blackjackSocket.once("error", (error) => {
            reject(error);
          });
        });
      }

      // Place the bet (staked from the demo wallet)
      console.log("Placing bet:", bet);
      await new Promise((resolve, reject) => {
        blackjackSocket.emit("place_bet", {
          betAmount: parseFloat(bet),
          walletType: "demo",
        });
        blackjackSocket.once("game_state", ({ success, gameState }) => {
          if (success && gameState) {
            updateGameState(gameState);
            resolve(gameState);
          } else {
            reject(new Error("Failed to place bet"));
          }
        });
        blackjackSocket.once("error", (error) => {
          reject(error);
        });
      });

      // The stake was just debited: refresh the balance readout.
      requestWalletRefresh();
    } catch (error) {
      console.error("Bet placement error:", error);
      toast.error(error.message || "Failed to place bet");
      // A rejected bet left the wallet untouched; resync the readout.
      requestWalletRefresh();
    }
  };

  const handleHit = () => {
    const blackjackSocket = getBlackjackSocket();
    if (blackjackSocket && betStarted) {
      blackjackSocket.emit("hit");
    }
  };

  const handleStand = () => {
    const blackjackSocket = getBlackjackSocket();
    if (blackjackSocket && betStarted) {
      blackjackSocket.emit("stand");
    }
  };

  const handleSplit = () => {
    const blackjackSocket = getBlackjackSocket();
    if (
      blackjackSocket &&
      betStarted &&
      userCards.length === 2 &&
      userCards[0].value === userCards[1].value
    ) {
      blackjackSocket.emit("split");
    }
  };

  const handleDouble = () => {
    const blackjackSocket = getBlackjackSocket();
    if (blackjackSocket && betStarted && userCards.length === 2) {
      blackjackSocket.emit("double");
    }
  };

  const handleSplitHit = () => {
    const blackjackSocket = getBlackjackSocket();
    if (blackjackSocket && split) {
      blackjackSocket.emit("hit");
    }
  };

  const handleSplitStand = () => {
    const blackjackSocket = getBlackjackSocket();
    if (blackjackSocket && split) {
      blackjackSocket.emit("stand");
    }
  };

  const handleCheckout = () => {
    setBettingStarted(false);
    setIsSmt(false);
  };

  useEffect(() => {
    if (userValue === 21) {
      setUserResult("win");
      handleCheckout();
    }

    if (dealerValue === 21) {
      setDealerResult("win");
      handleCheckout();
    }

    if (userValue > 21) {
      setUserResult("lose");
      handleCheckout();
    }

    if (dealerValue > 21) {
      setDealerResult("lose");
      handleCheckout();
    }
  }, [userValue, dealerValue]);

  const isGameEnd = () => {
    return (
      userResult ||
      dealerResult ||
      (userValue > 21 && dealerValue <= 21) ||
      (userValue <= 21 && dealerValue > 21)
    );
  };

  useEffect(() => {
    if (userCards.length !== 2) {
      setDouble(false);
    } else {
      setDouble(true);
    }
  }, [userCards]);

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
              <SideBar
                theatreMode={theatreMode}
                setBetMode={setBetMode}
                betMode={betMode}
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                handleMineBet={handlePlaceBet}
                bettingStarted={betStarted}
                isSmt={isSmt}
                handleCheckout={handleCheckout}
                split={split}
                double={double}
                handleDouble={handleDouble}
                handleHit={handleHit}
                handleSplit={handleSplit}
                handleStand={handleStand}
                activeHand={activeHand}
                splitHands={splitHands}
                splitValues={splitValues}
                splitResults={splitResults}
                splitBets={splitBets}
                handleSplitHit={handleSplitHit}
                handleSplitStand={handleSplitStand}
                userCards={userCards}
              />

              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1`}
              >
                <div className="w-full  text-white rounded-tr h-full justify-center text-3xl">
                  <>
                    <Game
                      userCards={split ? splitHands[activeHand] : userCards}
                      dealerCards={dealerCards}
                      userValue={split ? splitValues[activeHand] : userValue}
                      dealerValue={dealerValue}
                      userResult={split ? splitResults[activeHand] : userResult}
                      dealerResult={dealerResult}
                      deck={deck}
                      isSplit={split}
                      activeHand={activeHand}
                      splitHands={splitHands}
                      splitValues={splitValues}
                      splitResults={splitResults}
                    />
                  </>
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
    </>
  );
};

export default Frame;
