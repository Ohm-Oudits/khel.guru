import React, { useEffect, useRef, useState } from "react";
import Card from "./Card";
import { motion } from "framer-motion";
import { FaGreaterThanEqual, FaLessThanEqual } from "react-icons/fa";
import { FiChevronsRight } from "react-icons/fi";
import { CARD_SUITS, CARD_VALUES } from "./constant";

const Game = ({
  historyCards = [],
  currentCard = null,
  isGameStarting = false,
  isWaitingForCard = false,
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      // Update container width when it changes
      const updateWidth = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.scrollWidth);
        }
      };

      // Initial width update
      updateWidth();

      // Create a ResizeObserver to watch for width changes
      const resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(containerRef.current);

      // Scroll to the end when new cards are added
      if (historyCards.length > 9) {
        containerRef.current.scrollTo({
          left: containerRef.current.scrollWidth,
          behavior: "smooth",
        });
      }

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [historyCards]);

  // Only block the board while a round is actively starting. When idle (no
  // active game yet) we show the ready card layout — like Stake — instead of a
  // permanent "Loading Game..." state.
  const shouldShowLoading = isGameStarting;

  if (shouldShowLoading) {
    return (
      <div className="relative w-full text-white font-mono">
        <section>
          <div className="w-full h-[400px] flex items-center justify-center">
            <div className="text-2xl font-semibold text-gray-400 animate-pulse">
              {isGameStarting ? "Game Starting..." : "Loading Game..."}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Only show card history if we have cards and game is not starting
  const showCardHistory = historyCards.length > 0 && !isGameStarting;

  return (
    <div className="relative w-full text-white font-mono">
      <section>
        <div className="w-full h-[400px] flex items-center justify-around">
          <div className="flex max-md:hidden flex-col justify-center items-center">
            <Card shrink value={CARD_VALUES[11]} suit={CARD_SUITS[4]} />
            <h1 className="uppercase h-[12px] text-gray-400 mt-[-30px] text-[0.6rem]">
              King Being
            </h1>
            <h1 className="uppercase h-[12px] text-gray-400 text-[0.6rem]">
              the highest
            </h1>
          </div>
          <div className="flex md:hidden flex-col gap-2 items-center justify-center text-gray-600">
            <h1 className="transform scale-y-[3.5] mb-3">↑</h1>
            <h2 className="text-sm">K</h2>
          </div>
          <div>
            <Card
              isRed={currentCard?.color}
              value={currentCard?.value}
              suit={currentCard?.suit}
            />
          </div>
          <div className="flex max-md:hidden flex-col justify-center items-center">
            <Card shrink value={CARD_VALUES[12]} suit={CARD_SUITS[5]} />
            <h1 className="uppercase h-[12px] text-gray-400 mt-[-30px] text-[0.6rem]">
              Ace Being
            </h1>
            <h1 className="uppercase h-[12px] text-gray-400 text-[0.6rem]">
              the lowest
            </h1>
          </div>
          <div className="flex md:hidden flex-col gap-2 items-center justify-center text-gray-600">
            <h1 className="transform scale-y-[3.5] mb-3">↓</h1>
            <h2 className="text-sm">A</h2>
          </div>
        </div>

        {showCardHistory && (
          <div className="p-2 w-full h-[200px] max-lg:mb-4 overflow-hidden">
            <div
              ref={containerRef}
              className="w-full h-[180px] relative rounded-md bg-primary-1 flex overflow-x-scroll"
            >
              <div className="absolute left-0 z-[1] p-1 px-2">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Card
                    small
                    isRed={historyCards[0]?.color}
                    value={historyCards[0]?.value}
                    suit={historyCards[0]?.suit}
                  />
                  <h1 className="text-xs py-1 w-full bg-button-primary text-black font-semibold font-sans pt-1 flex items-center justify-center rounded">
                    Start Card
                  </h1>
                </div>
              </div>

              {historyCards.slice(1).map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    left: `${5.8 * (index + 1)}rem`,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                    duration: 0.5,
                  }}
                  className="absolute z-[2] p-1 px-2"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="relative">
                      <div className="absolute flex items-center justify-center z-[40] rounded-md top-1/2 left-[-1rem] -translate-y-1/2 w-8 h-8 bg-white border border-gray-500 shadow-md text-button">
                        {card?.result ? (
                          <>
                            {card.result === "high-true" && (
                              <FaGreaterThanEqual
                                className="text-green-500"
                                size={12}
                              />
                            )}
                            {card.result === "high-false" && (
                              <FaGreaterThanEqual
                                className="text-red-500"
                                size={12}
                              />
                            )}
                            {card.result === "low-true" && (
                              <FaLessThanEqual
                                className="text-green-500"
                                size={12}
                              />
                            )}
                            {card.result === "low-false" && (
                              <FaLessThanEqual
                                className="text-red-500"
                                size={12}
                              />
                            )}
                          </>
                        ) : (
                          <FiChevronsRight
                            className="text-orange-500"
                            size={18}
                          />
                        )}
                      </div>
                      <Card
                        isRed={card?.color}
                        small
                        value={card?.value}
                        suit={card?.suit}
                      />
                    </div>
                    <h1 className="text-xs py-1 w-full bg-button-primary text-black font-semibold font-sans pt-1 flex items-center justify-center rounded">
                      {`Card ${index + 2}`}
                    </h1>
                  </div>
                </motion.div>
              ))}

              {/* Add some space at the end */}
              <div
                className="w-[7.6rem] h-full bg-transparent absolute z-[2] p-1 px-2"
                style={{ left: `${5.8 * (historyCards.length + 1)}rem` }}
              ></div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Game;
