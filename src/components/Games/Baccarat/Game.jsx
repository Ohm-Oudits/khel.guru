import { useState, useEffect } from "react";
import Card from "./Card";
import { motion } from "framer-motion";

const CARD_SUITS = ["♦", "♥", "♠", "♣"];
const CARD_VALUES = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

const createDeck = () => {
  let deck = [];
  for (let i = 0; i < 52; i++) {
    deck.push({
      suit: CARD_SUITS[i % CARD_SUITS.length],
      value: CARD_VALUES[i % CARD_VALUES.length],
      id: i,
      rand: Math.floor(Math.random() * 20) + 1,
    });
  }
  return deck.sort(() => Math.random() - 0.5); // Shuffle the deck
};

// eslint-disable-next-line
const CardBack = ({ rand, top = "50%" }) => (
  <div
    className={`w-24 h-36 card card${rand} relative rounded-md shadow-lg bg-blue-600 border-2 border-white flex items-center justify-center`}
  >
    <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-10"></div>
    <h1
      className={`text-white font-medium absolute top-[${top}] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-[0.9rem]`}
    >
      Khel <br />
      <span className="pl-2 pt-[-10px]"> Guru</span>
    </h1>
  </div>
);

// eslint-disable-next-line
const FlippableCard = ({ card, position, isWinner }) => {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFlipped(true), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.5, top: "-4.5rem", left: "calc(100% - 6rem)" }}
      animate={{ scale: 1, top: `${position.top}%`, left: `${position.left}%` }}
      transition={{ duration: 0.4 }}
      className={`absolute flip-container ${isWinner ? "glow" : ""}`} // Add glow effect
    >
      <div className={`flip-card ${flipped ? "flipped" : ""}`}>
        <div className="card-back">
          <CardBack rand={card.rand} />
        </div>
        <div className="card-front">
          <Card medium value={card.value} suit={card.suit} />
        </div>
      </div>
    </motion.div>
  );
};

// eslint-disable-next-line
const Game = ({
  cardsNumber = 6,
  betStarted,
  bet,
  chipBet,
  setBettingStarted,
  playerBet,
  setPlayerBet,
  bankerBet,
  setBankerBet,
  tieBet,
  setTieBet,
  selectedSpots = { player: false, tie: false, banker: false },
  setSelectedSpots = () => {},
}) => {
  const [deck, setDeck] = useState(createDeck());
  const [userCards, setUserCards] = useState([]);
  const [bankerCards, setBankerCards] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);

  // Start game after 2 seconds on first load
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setGameStarted(true);
  //   }, 2000);
  //   return () => clearTimeout(timer);
  // }, []);

  // Restart game after 4 seconds once the winner is declared

  useEffect(() => {
    if (betStarted) {
      const restartTimer = setTimeout(() => {
        setDeck(createDeck());
        setUserCards([]);
        setBankerCards([]);
        setWinner(null);
        setGameStarted(false);

        setGameStarted(true); // Restart after 2 seconds
      }, 500);
      return () => clearTimeout(restartTimer);
    }
  }, [betStarted]);

  const calculateScore = (cards) => {
    let score = 0;
    for (let card of cards) {
      if (["J", "Q", "K", "10"].includes(card.value)) score += 0;
      else if (card.value === "A") score += 1;
      else score += parseInt(card.value);
    }
    return score % 10;
  };

  const placeBet = (type) => {
    if (betStarted) return; // Prevents betting once the round is in progress

    // Mark the spot as selected on click (even for a 0 chip) so a 0 stake
    // still counts as a placed bet.
    if (type === "Player") {
      setPlayerBet((prev) => prev + (Number(chipBet) || 0));
      setSelectedSpots((prev) => ({ ...prev, player: true }));
    }
    if (type === "Tie") {
      setTieBet((prev) => prev + (Number(chipBet) || 0));
      setSelectedSpots((prev) => ({ ...prev, tie: true }));
    }
    if (type === "Banker") {
      setBankerBet((prev) => prev + (Number(chipBet) || 0));
      setSelectedSpots((prev) => ({ ...prev, banker: true }));
    }
  };

  const playerScore = calculateScore(userCards);
  const bankerScore = calculateScore(bankerCards);

  useEffect(() => {
    if (gameStarted) {
      const dealCards = () => {
        if (deck.length > 0 && !isAnimating) {
          const totalDealtCards = userCards.length + bankerCards.length;
          if (totalDealtCards >= cardsNumber) return;

          setIsAnimating(true);
          const newCard = deck[0];
          setDeck((prevDeck) => prevDeck.slice(1));

          if (userCards.length <= bankerCards.length) {
            setUserCards((prev) => [...prev, newCard]);
          } else {
            setBankerCards((prev) => [...prev, newCard]);
          }

          setTimeout(() => setIsAnimating(false), 800);
        }
      };

      if (
        deck.length > 0 &&
        userCards.length + bankerCards.length < cardsNumber
      ) {
        const interval = setInterval(dealCards, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [deck, userCards, bankerCards, isAnimating, cardsNumber, gameStarted]);

  useEffect(() => {
    if (
      userCards.length === cardsNumber / 2 &&
      bankerCards.length === cardsNumber / 2
    ) {
      setTimeout(() => {
        const winnerText =
          playerScore > bankerScore
            ? "Player Wins!"
            : bankerScore > playerScore
            ? "Banker Wins!"
            : "It's a Tie!";

        setWinner(winnerText);

        // Reset bets after the game ends
        setTimeout(() => {
          setPlayerBet(0);
          setTieBet(0);
          setBankerBet(0);
          setSelectedSpots({ player: false, tie: false, banker: false });
        }, 2000);
        setBettingStarted(false);

        // Clear all cards and reset the deck after a short delay
        setTimeout(() => {
          setUserCards([]); // Clear player cards
          setBankerCards([]); // Clear banker cards
          setDeck(createDeck()); // Reshuffle the deck
          setWinner(null); // Remove winner text
          setGameStarted(false); // Reset game state
        }, 2000); // 2-second delay before resetting
      }, 700);
    }
  }, [userCards, bankerCards, cardsNumber, playerScore, bankerScore]);

  return (
    <div className="relative w-full h-[600px] text-base text-white overflow-hidden">
      <div className="w-full h-[450px] relative">
        {/* Deck Pile */}
        <div className="absolute right-28 top-[-85px] z-10">
          {deck.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ y: `-${i * 2}px`, opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 - i * 0.02 }}
              transition={{ duration: 0.2, delay: i * 0.1 }}
              className="absolute"
              style={{
                zIndex: 10 - i,
                transform: `rotate(${i % 2 === 0 ? i : -i}deg)`,
              }}
            >
              <CardBack top={"75%"} rand={card.rand} />
            </motion.div>
          ))}
        </div>

        {/* Player and Dealer Score */}
        <div className="absolute px-4 py-2 rounded bg-gray-800 top-10 left-[30%]">
          Player: {playerScore}
        </div>
        <div className="absolute px-4 py-2 rounded bg-gray-800 top-10 left-[55%]">
          Banker: {bankerScore}
        </div>

        {/* Render Player Cards */}
        {userCards.map((card, index) => (
          <FlippableCard
            key={card.id}
            card={card}
            position={{ top: 35 + index * 6, left: 20 + index * 4 }}
          />
        ))}

        {/* Render banker Cards */}
        {bankerCards.map((card, index) => (
          <FlippableCard
            key={card.id}
            card={card}
            position={{ top: 35 + index * 6, left: 57 + index * 4 }}
          />
        ))}

        {userCards.map((card, index) => (
          <FlippableCard
            key={card.id}
            card={card}
            position={{ top: 35 + index * 6, left: 20 + index * 4 }}
            isWinner={winner === "Player Wins!" || winner === "It's a Tie!"} // Apply glow if Player or Tie wins
          />
        ))}

        {bankerCards.map((card, index) => (
          <FlippableCard
            key={card.id}
            card={card}
            position={{ top: 35 + index * 6, left: 57 + index * 4 }}
            isWinner={winner === "Banker Wins!" || winner === "It's a Tie!"} // Apply glow if Banker or Tie wins
          />
        ))}

        {/* Winner Announcement */}
        {winner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`absolute top-1/2 left-[45%] transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-white text-sm font-bold 
      ${
        winner === "Player Wins!"
          ? "border-2 border-green-500 bg-green-900/80"
          : ""
      }
      ${
        winner === "It's a Tie!"
          ? "border-2 border-blue-500 bg-blue-900/80"
          : ""
      }
      ${
        winner === "Banker Wins!" ? "border-2 border-red-500 bg-red-900/80" : ""
      }`}
          >
            {winner === "Player Wins!" && (
              <div className="flex flex-col items-center">
                <span className="text-lg">2x</span>
                <span>${(playerBet * 2).toFixed(2)}</span>{" "}
                {/* Double Player Bet */}
              </div>
            )}

            {winner === "It's a Tie!" && (
              <div className="flex flex-col items-center">
                <span className="text-lg">8x</span>
                <span>${(tieBet * 8).toFixed(2)}</span>{" "}
                {/* Multiply Tie Bet by 8 */}
              </div>
            )}

            {winner === "Banker Wins!" && (
              <div className="flex flex-col items-center">
                <span className="text-lg">1.95x</span>
                <span>${(bankerBet * 1.95).toFixed(2)}</span>{" "}
                {/* Deduct 5% Commission */}
              </div>
            )}
          </motion.div>
        )}
      </div>
      {/* Bottom Action Section */}
      <div className="absolute bottom-10 left-0 right-0">
        <div className="w-full px-3 flex items-center justify-center gap-3 max-md:gap-2">
          {/* Player Button */}
          <div className="relative bg-primary py-3 px-12 max-lg:px-8 max-lg:py-3 max-md:text-xs flex flex-col items-center justify-center border border-gray-500 cursor-pointer rounded hover:bg-primary/10 transition duration-300 ease-in-out">
            {selectedSpots.player && ( // Show red dot when the Player spot is selected
              <div className="absolute bg-red-600 w-3 h-3 max-lg:h-2 max-lg:w-2 rounded-full z-10 top-2 right-2"></div>
            )}
            <button
              className="text-lg max-md:text-sm font-semibold"
              onClick={() => placeBet("Player")}
            >
              Player
            </button>
            <h2>${playerBet.toFixed(2)}</h2> {/* Display Player bet amount */}
          </div>

          {/* Tie Button */}
          <div className="relative bg-primary py-3 px-12 max-lg:px-8 max-lg:py-3 max-md:text-xs flex flex-col items-center justify-center border border-gray-500 cursor-pointer rounded hover:bg-primary/10 transition duration-300 ease-in-out">
            {selectedSpots.tie && ( // Show red dot when the Tie spot is selected
              <div className="absolute bg-red-600 w-3 h-3 max-lg:h-2 max-lg:w-2 rounded-full z-10 top-2 right-2"></div>
            )}
            <button
              className="text-lg max-md:text-sm font-semibold"
              onClick={() => placeBet("Tie")}
            >
              Tie
            </button>
            <h2>${tieBet.toFixed(2)}</h2> {/* Display Tie bet amount */}
          </div>

          {/* Banker Button */}
          <div className="relative bg-primary py-3 px-12 max-lg:px-8 max-lg:py-3 max-md:text-xs flex flex-col items-center justify-center border border-gray-500 cursor-pointer rounded hover:bg-primary/10 transition duration-300 ease-in-out">
            {selectedSpots.banker && ( // Show red dot when the Banker spot is selected
              <div className="absolute bg-red-600 w-3 h-3 max-lg:h-2 max-lg:w-2 rounded-full z-10 top-2 right-2"></div>
            )}
            <button
              className="text-lg max-md:text-sm font-semibold"
              onClick={() => placeBet("Banker")}
            >
              Banker
            </button>
            <h2>${bankerBet.toFixed(2)}</h2> {/* Display Banker bet amount */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
