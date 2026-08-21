import React, { useEffect, useRef, useState } from "react";
import Card from "./Card";
import { motion } from "framer-motion";
import { FaGreaterThanEqual, FaLessThanEqual, FaRandom } from "react-icons/fa";
import { FiChevronsRight } from "react-icons/fi";
import { CARD_SUITS, CARD_VALUES, randomPreviewCard } from "./constant";

const ResultMark = ({ result }) => (
  <div className="absolute left-0 top-1/2 z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-gray-500 bg-white shadow-md">
    {result === "high-true" && (
      <FaGreaterThanEqual className="text-green-500" size={11} />
    )}
    {result === "high-false" && (
      <FaGreaterThanEqual className="text-red-500" size={11} />
    )}
    {result === "low-true" && (
      <FaLessThanEqual className="text-green-500" size={11} />
    )}
    {result === "low-false" && (
      <FaLessThanEqual className="text-red-500" size={11} />
    )}
    {!result && <FiChevronsRight className="text-orange-500" size={14} />}
  </div>
);

const Game = ({
  historyCards = [],
  currentCard = null,
  isGameStarting = false,
  bettingStarted = false,
  settledMultiplier = null,
  onShufflePreview,
}) => {
  const containerRef = useRef(null);
  const [idleCard, setIdleCard] = useState(randomPreviewCard);
  const [flipDeg, setFlipDeg] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const pendingCardRef = useRef(null);
  const isIdle = !bettingStarted && !isGameStarting && settledMultiplier == null;
  const displayCard = currentCard || idleCard;
  const startCard = historyCards[0] || displayCard;
  const dealtCards = historyCards.slice(1);

  useEffect(() => {
    if (isIdle) return undefined;
    pendingCardRef.current = null;
    setIsFlipping(false);
    setFlipDeg(0);
    return undefined;
  }, [isIdle]);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    containerRef.current.scrollTo({
      left: containerRef.current.scrollWidth,
      behavior: "smooth",
    });
    return undefined;
  }, [historyCards]);

  const pickShuffledCard = () => {
    let next = randomPreviewCard();
    let attempts = 0;
    while (
      next.value === idleCard.value &&
      next.suit === idleCard.suit &&
      attempts < 8
    ) {
      next = randomPreviewCard();
      attempts += 1;
    }
    return next;
  };

  const shufflePreview = () => {
    if (!isIdle || isFlipping) return;
    setIsFlipping(true);
    const beginFlip = (nextCard) => {
      if (nextCard) {
        pendingCardRef.current = nextCard;
        setFlipDeg(90);
        return;
      }
      if (currentCard) {
        setIsFlipping(false);
        setFlipDeg(0);
        return;
      }
      pendingCardRef.current = pickShuffledCard();
      setFlipDeg(90);
    };
    if (onShufflePreview) {
      onShufflePreview(beginFlip);
      return;
    }
    beginFlip(pickShuffledCard());
  };

  return (
    <div className="relative grid h-auto w-full grid-rows-[auto_auto] font-mono text-white md:h-full md:min-h-[520px] md:grid-rows-[minmax(0,1fr)_minmax(10.5rem,42%)]">
      <div className="flex items-end justify-center gap-2 px-2 pb-0 pt-4 md:gap-10 md:px-6 md:pb-2 md:pt-8">
        <div className="flex flex-col items-center gap-1.5">
          <Card skipMotion shrink value={CARD_VALUES[12]} suit={CARD_SUITS[4]} />
          <p className="w-[4.6rem] text-center text-[0.5rem] uppercase leading-tight text-gray-400 md:w-[5.5rem] md:text-[0.6rem]">
            King being
            <br />
            the highest
          </p>
        </div>
        <div className="relative flex flex-col items-center">
          <div className="[perspective:900px]">
            {isIdle ? (
              <motion.div
                animate={{ rotateY: flipDeg }}
                transition={{
                  duration: 0.22,
                  ease: flipDeg === 90 ? "easeIn" : "easeOut",
                }}
                onAnimationComplete={() => {
                  if (!isIdle) return;
                  if (pendingCardRef.current) {
                    setIdleCard(pendingCardRef.current);
                    pendingCardRef.current = null;
                    setFlipDeg(0);
                    return;
                  }
                  setIsFlipping(false);
                }}
                style={{
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                <Card
                  skipMotion
                  isRed={displayCard?.color}
                  value={displayCard?.value}
                  suit={displayCard?.suit}
                />
              </motion.div>
            ) : (
              <Card
                skipMotion
                isRed={displayCard?.color}
                value={displayCard?.value}
                suit={displayCard?.suit}
              />
            )}
          </div>
          {settledMultiplier != null && (
            <div
              className={`pointer-events-none absolute left-1/2 top-[3.75rem] z-10 -translate-x-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-2xl font-bold shadow-lg md:top-24 md:text-4xl ${Number(settledMultiplier) <= 0
                ? "bg-red-600 text-white"
                : "bg-button-primary text-black"
                }`}
            >
              {Number(settledMultiplier).toFixed(2)}x
            </div>
          )}
          {isIdle && settledMultiplier == null && (
            <button
              type="button"
              onClick={shufflePreview}
              disabled={isFlipping}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#2f4553] px-3 py-1 text-[0.7rem] font-semibold text-white transition hover:bg-[#3a5566] enabled:active:scale-95 disabled:opacity-60 md:text-xs"
            >
              <FaRandom size={11} />
              Shuffle
            </button>
          )}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Card skipMotion shrink value={CARD_VALUES[0]} suit={CARD_SUITS[5]} />
          <p className="w-[4.6rem] text-center text-[0.5rem] uppercase leading-tight text-gray-400 md:w-[5.5rem] md:text-[0.6rem]">
            Ace being
            <br />
            the lowest
          </p>
        </div>
      </div>

      <div className="border-t border-[#1a2c38] px-2 py-1.5 md:py-2">
        <div
          ref={containerRef}
          className="flex h-[7.25rem] w-full items-center overflow-x-auto overflow-y-hidden rounded-md bg-primary-1 px-2 md:h-full md:min-h-[11rem]"
        >
          {startCard && (
            <div className="relative z-[1] shrink-0">
              <div className="flex flex-col items-center justify-center gap-1">
                <Card
                  skipMotion
                  small
                  isRed={startCard?.color}
                  value={startCard?.value}
                  suit={startCard?.suit}
                />
                <h1 className="flex w-full items-center justify-center rounded bg-button-primary py-0.5 font-sans text-[10px] font-semibold text-black md:py-1 md:text-xs">
                  Start Card
                </h1>
              </div>
            </div>
          )}

          {dealtCards.map((card, index) => (
            <motion.div
              key={`${card?.value}-${card?.suit}-${index}`}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative shrink-0 -ml-[1.85rem] md:-ml-[2.8rem]"
              style={{ zIndex: index + 2 }}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="relative">
                  <ResultMark result={card?.result} />
                  <Card
                    skipMotion
                    isRed={card?.color}
                    small
                    value={card?.value}
                    suit={card?.suit}
                  />
                </div>
                <h1 className="flex w-[3.7rem] items-center justify-center rounded bg-button-primary py-0.5 font-sans text-[10px] font-semibold text-black md:w-[5.6rem] md:py-1 md:text-xs">
                  {`Card ${index + 2}`}
                </h1>
              </div>
            </motion.div>
          ))}
          <div className="w-4 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default Game;
