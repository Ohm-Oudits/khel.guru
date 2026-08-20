import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CardBack, FlippableCard } from "./Components";

const Game = ({
  deck,
  userCards,
  dealerCards,
  userValue,
  dealerValue,
  userResult,
  dealerResult,
  isSplit,
  activeHand,
  splitHands,
  splitValues,
  splitResults,
}) => {
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const [animatedCards, setAnimatedCards] = useState({
    user: [],
    dealer: [],
    split1: [],
    split2: [],
  });
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle card animations
  useEffect(() => {
    setAnimationComplete(false);

    const animateCards = async () => {
      // Reset animated cards
      setAnimatedCards({
        user: [],
        dealer: [],
        split1: [],
        split2: [],
      });

      // Animate dealer cards first
      for (let i = 0; i < dealerCards.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setAnimatedCards((prev) => ({
          ...prev,
          dealer: [...prev.dealer, dealerCards[i]],
        }));
      }

      // Then animate user cards
      if (isSplit) {
        // Animate split hands
        for (let hand = 0; hand < 2; hand++) {
          const currentHand = splitHands[hand];
          for (let i = 0; i < currentHand.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            setAnimatedCards((prev) => ({
              ...prev,
              [`split${hand + 1}`]: [
                ...prev[`split${hand + 1}`],
                currentHand[i],
              ],
            }));
          }
        }
      } else {
        // Animate regular hand
        for (let i = 0; i < userCards.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setAnimatedCards((prev) => ({
            ...prev,
            user: [...prev.user, userCards[i]],
          }));
        }
      }

      setAnimationComplete(true);
    };

    animateCards();
  }, [userCards, dealerCards, isSplit, splitHands]);

  return (
    <div className="relative w-full h-[600px] max-lg:h-[600px] text-base text-white overflow-hidden">
      {/* DeckPile */}
      <div className="absolute right-28 top-[-85px] z-10">
        {deck.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1 - i * 0.02,
            }}
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

      <div className="w-full h-[600px] relative">
        {/* Split Hands Display */}
        {isSplit && (
          <div className="absolute top-[4%] left-[50%] transform -translate-x-1/2 flex gap-4">
            {splitHands.map((hand, index) => (
              <div
                key={index}
                className={`px-3 py-1 rounded ${
                  activeHand === index
                    ? "bg-button text-black"
                    : "bg-gray-50/10"
                }`}
              >
                Hand {index + 1}
              </div>
            ))}
          </div>
        )}

        {/* User Cards */}
        {isSplit ? (
          // Display both split hands
          <div className="absolute top-0 left-0 w-full h-1/2 flex justify-center items-center">
            {/* First Split Hand */}
            <div className={`mt-20 ${activeHand === 0 ? "z-2" : "z-1"}`}>
              {splitHands[0]?.map((card, index) => (
                <FlippableCard
                  key={card.id}
                  card={card}
                  position={{
                    top: isLargeScreen ? 22 + index * 4 : 26 + index * 4,
                    left: isLargeScreen ? 20 + index * 5 : 15 + index * 5,
                  }}
                  isFlipped={card.flipped}
                />
              ))}
            </div>
            {/* Second Split Hand */}
            <div className={`mt-20 ${activeHand === 1 ? "z-2" : "z-1"}`}>
              {splitHands[1]?.map((card, index) => (
                <FlippableCard
                  key={card.id}
                  card={card}
                  position={{
                    top: isLargeScreen ? 22 + index * 4 : 26 + index * 4,
                    left: isLargeScreen ? 60 + index * 5 : 55 + index * 5,
                  }}
                  isFlipped={card.flipped}
                />
              ))}
            </div>
          </div>
        ) : (
          // Regular hand display
          userCards.map((card, index) => (
            <FlippableCard
              key={card.id}
              card={card}
              position={{
                top: 12 + index * 4,
                left: isLargeScreen ? 40 + index * 5 : 30 + index * 5,
              }}
              isFlipped={card.flipped}
            />
          ))
        )}

        {/* Dealer Cards */}
        {dealerCards.map((card, index) => (
          <FlippableCard
            key={card.id}
            card={card}
            position={{
              top: 64 + index * 4,
              left: isLargeScreen ? 40 + index * 5 : 30 + index * 5,
            }}
            isFlipped={card.flipped}
          />
        ))}

        {/* Player Score(s) */}
        {isSplit ? (
          // Split hand scores
          <>
            <div
              className={`absolute left-[20%] max-lg:left-[16%] ${
                isLargeScreen ? "top-[4%]" : "top-[40%]"
              }`}
            >
              <h1
                className={`font-semibold text-[0.9rem] px-5 py-0.5 rounded ${
                  splitResults[0] &&
                  (splitResults[0] === "win"
                    ? "bg-green-500 text-black"
                    : splitResults[0] === "lose"
                    ? "bg-red-500"
                    : "bg-orange-500")
                }`}
              >
                Hand 1 : {splitValues[0]}
              </h1>
            </div>
            <div
              className={`absolute left-[60%] max-lg:left-[56%] ${
                isLargeScreen ? "top-[4%]" : "top-[40%]"
              }`}
            >
              <h1
                className={`font-semibold text-[0.9rem] px-5 py-0.5 rounded ${
                  splitResults[1] &&
                  (splitResults[1] === "win"
                    ? "bg-green-500 text-black"
                    : splitResults[1] === "lose"
                    ? "bg-red-500"
                    : "bg-orange-500")
                }`}
              >
                Hand 2 : {splitValues[1]}
              </h1>
            </div>
          </>
        ) : (
          // Regular score
          <div className="absolute top-[4%] left-[20%] max-lg:left-[16%]">
            <h1
              className={`font-semibold text-[0.9rem] px-5 py-0.5 rounded bg-gray-50/10 ${
                userResult &&
                (userResult === "win"
                  ? "bg-green-500 text-black"
                  : userResult === "lose"
                  ? "bg-red-500"
                  : "bg-orange-500")
              }`}
            >
              Player: {userValue}
            </h1>
          </div>
        )}

        {/* Blackjack payouts */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center flex-col font-semibold text-zinc-400 text-[0.9rem]">
          <h1>Blackjack Pays 3 to 2</h1>
          <h1 className="mt-[-5px]">Insurance Pays 2 to 1</h1>
        </div>

        {/* Dealer Score */}
        <div className="absolute top-[56%] left-[20%] max-lg:left-[16%]">
          <h1
            className={`font-semibold text-[0.9rem] px-5 py-0.5 rounded bg-gray-50/10 ${
              dealerResult &&
              (dealerResult === "win"
                ? "bg-green-500 text-black "
                : dealerResult === "lose"
                ? "bg-red-500"
                : "bg-orange-500")
            }`}
          >
            Dealer: {dealerValue}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Game;
