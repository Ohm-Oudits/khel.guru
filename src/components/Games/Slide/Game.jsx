import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const CARD_WIDTH = 96;
const CARD_GAP = 16;
const CARD_SPAN = CARD_WIDTH + CARD_GAP;
const SPIN_VEL = 0.92;
const DECEL_CARDS = 16;
const WAIT_MS = 5_000;

const randomMultiplier = () =>
  parseFloat((Math.random() * 9 + 1).toFixed(2));

const buildStrip = (length = 80) =>
  Array.from({ length }, (_, i) => ({
    id: i,
    multiplier: randomMultiplier(),
  }));

const hermite = (x0, v0, x1, duration, t) => {
  const D = x1 - x0;
  const T = duration;
  const b = (v0 - (2 * D) / T) / (T * T);
  const a = (-v0 - 3 * b * T * T) / (2 * T);
  return x0 + v0 * t + a * t * t + b * t * t * t;
};

const Game = ({
  timeLeft,
  targetMultiplier,
  phase = "waiting",
  elapsedMs = 0,
}) => {
  const [gameState, setGameState] = useState("waiting");
  const [progress, setProgress] = useState(0);
  const [cards, setCards] = useState(buildStrip);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const containerRef = useRef(null);
  const stickRef = useRef(null);
  const viewportRef = useRef(null);
  const animationRef = useRef(null);
  const lastTsRef = useRef(0);
  const scrollXRef = useRef(0);
  const velocityRef = useRef(SPIN_VEL);
  const modeRef = useRef("idle");
  const decelRef = useRef(null);
  const livePhaseRef = useRef(phase);
  const cardsRef = useRef(cards);
  const nextIdRef = useRef(80);
  const lastResultRef = useRef(null);
  const winnerIndexRef = useRef(null);

  cardsRef.current = cards;
  winnerIndexRef.current = winnerIndex;
  if (targetMultiplier != null) lastResultRef.current = Number(targetMultiplier);

  const applyTransform = (x) => {
    scrollXRef.current = x;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${-x}px)`;
    }
  };

  const stopLoop = () => {
    modeRef.current = "idle";
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const centerOnIndex = (index) => {
    const viewport = viewportRef.current;
    const cardCenter = index * CARD_SPAN + CARD_GAP / 2 + CARD_WIDTH / 2;
    if (!viewport || viewport.clientWidth < 40) return cardCenter;
    return cardCenter - viewport.clientWidth / 2;
  };

  const currentCardIndex = () => {
    const viewport = viewportRef.current;
    const mid = viewport?.clientWidth ? viewport.clientWidth / 2 : 0;
    const underNeedle =
      scrollXRef.current + mid - CARD_GAP / 2 - CARD_WIDTH / 2;
    return Math.max(0, Math.round(underNeedle / CARD_SPAN));
  };

  const setCardsAndRef = (next) => {
    cardsRef.current = next;
    setCards(next);
  };

  const appendUntil = (index) => {
    const current = cardsRef.current;
    if (current.length > index + 8) return;
    const next = [...current];
    while (next.length <= index + 12) {
      next.push({
        id: nextIdRef.current++,
        multiplier: randomMultiplier(),
      });
    }
    setCardsAndRef(next);
  };

  const compactBehind = () => {
    const keepFrom = Math.max(0, currentCardIndex() - 4);
    if (keepFrom < 24) return;
    setCardsAndRef(cardsRef.current.slice(keepFrom));
    applyTransform(scrollXRef.current - keepFrom * CARD_SPAN);
    if (winnerIndexRef.current != null) {
      const shifted = winnerIndexRef.current - keepFrom;
      winnerIndexRef.current = shifted;
      setWinnerIndex(shifted);
    }
  };

  const tick = (now) => {
    const last = lastTsRef.current || now;
    const dt = Math.min(32, now - last);
    lastTsRef.current = now;

    if (modeRef.current === "spin") {
      applyTransform(scrollXRef.current + velocityRef.current * dt);
    } else if (modeRef.current === "decel") {
      const decel = decelRef.current;
      if (decel) {
        const elapsed = now - decel.startedAt;
        if (elapsed >= decel.duration) {
          applyTransform(decel.targetX);
          velocityRef.current = 0;
          modeRef.current = "idle";
          setGameState("result");
          animationRef.current = null;
          return;
        }
        const x = hermite(
          decel.startX,
          decel.startV,
          decel.targetX,
          decel.duration,
          elapsed
        );
        const prev = elapsed > 0 ? elapsed - dt : 0;
        const xPrev = hermite(
          decel.startX,
          decel.startV,
          decel.targetX,
          decel.duration,
          Math.max(0, prev)
        );
        velocityRef.current = dt > 0 ? (x - xPrev) / dt : 0;
        applyTransform(x);
      }
    } else {
      animationRef.current = null;
      return;
    }

    animationRef.current = requestAnimationFrame(tick);
  };

  const ensureLoop = () => {
    if (animationRef.current) return;
    lastTsRef.current = performance.now();
    animationRef.current = requestAnimationFrame(tick);
  };

  const paintWinner = (index, multiplier) => {
    const value = Number(multiplier);
    lastResultRef.current = value;
    const next = [...cardsRef.current];
    if (!next[index]) return;
    next[index] = { ...next[index], multiplier: value };
    setCardsAndRef(next);
    winnerIndexRef.current = index;
    setWinnerIndex(index);
  };

  const snapToResult = (index, multiplier) => {
    stopLoop();
    paintWinner(index, multiplier);
    applyTransform(centerOnIndex(index));
    setGameState("result");
  };

  const startSpin = (fromElapsedMs = 0) => {
    velocityRef.current = SPIN_VEL;
    modeRef.current = "spin";
    decelRef.current = null;
    winnerIndexRef.current = null;
    setWinnerIndex(null);
    setGameState("scrolling");
    if (scrollXRef.current < 1 && fromElapsedMs > 0) {
      applyTransform(SPIN_VEL * fromElapsedMs);
    }
    ensureLoop();
  };

  const beginDecel = (multiplier, attempt = 0) => {
    if (modeRef.current === "decel") return;
    const viewportWidth = viewportRef.current?.clientWidth || 0;
    if (viewportWidth < 40 && attempt < 10) {
      requestAnimationFrame(() => beginDecel(multiplier, attempt + 1));
      return;
    }

    const targetIndex = currentCardIndex() + DECEL_CARDS;
    appendUntil(targetIndex);
    paintWinner(targetIndex, multiplier);

    const startX = scrollXRef.current;
    const startV = Math.max(velocityRef.current, SPIN_VEL * 0.55);
    const targetX = centerOnIndex(targetIndex);
    const distance = targetX - startX;
    if (distance <= CARD_SPAN) {
      snapToResult(targetIndex, multiplier);
      return;
    }

    const duration = (3 * distance) / startV;
    decelRef.current = {
      startX,
      startV,
      targetX,
      duration,
      startedAt: performance.now(),
    };
    modeRef.current = "decel";
    setGameState("scrolling");
    ensureLoop();
  };

  useEffect(() => {
    const phaseChanged = livePhaseRef.current !== phase;
    livePhaseRef.current = phase;

    if (phase === "waiting") {
      stopLoop();
      setGameState(winnerIndexRef.current != null ? "result" : "waiting");
      return undefined;
    }

    if (phase === "spinning") {
      if (!phaseChanged && modeRef.current === "spin") return undefined;
      compactBehind();
      appendUntil(currentCardIndex() + 80);
      startSpin(elapsedMs);
      return undefined;
    }

    if (phase === "result" && targetMultiplier != null) {
      const result = Number(targetMultiplier);
      if (modeRef.current === "spin" || modeRef.current === "decel") {
        beginDecel(result);
      } else if (winnerIndexRef.current == null) {
        const index = Math.max(4, currentCardIndex());
        appendUntil(index);
        snapToResult(index, result);
      }
    }
    return undefined;
  }, [phase, targetMultiplier]);

  useEffect(() => {
    if (phase !== "waiting" || timeLeft == null) {
      setProgress(phase === "waiting" ? 0 : 100);
      return;
    }
    setProgress(
      Math.max(0, Math.min(100, ((WAIT_MS - timeLeft * 1000) / WAIT_MS) * 100))
    );
  }, [timeLeft, phase]);

  useEffect(() => () => stopLoop(), []);

  const showCountdownBar = phase === "waiting" && timeLeft != null;

  return (
    <div className="relative flex h-full min-h-[260px] w-full flex-col items-center justify-center overflow-hidden bg-gray-900 pb-4 text-white max-lg:min-h-[240px] lg:min-h-[360px]">
      <div ref={viewportRef} className="relative h-52 w-full overflow-hidden max-lg:h-48 lg:h-64">
        <div
          ref={containerRef}
          className="absolute left-0 top-0 flex h-full items-center"
          style={{ willChange: "transform" }}
        >
          {cards.map((card, index) => {
            const isWinner =
              winnerIndex != null &&
              index === winnerIndex &&
              phase !== "spinning" &&
              gameState !== "scrolling";
            const shownMultiplier =
              isWinner && lastResultRef.current != null
                ? lastResultRef.current
                : card.multiplier;
            return (
              <div
                key={card.id}
                data-value={shownMultiplier}
                className={`flex h-32 items-center justify-center rounded-lg bg-gray-800 text-sm max-lg:h-28 lg:h-40 ${
                  isWinner ? "z-10 border-2 border-yellow-500" : "z-0"
                }`}
                style={{
                  width: CARD_WIDTH,
                  marginLeft: CARD_GAP / 2,
                  marginRight: CARD_GAP / 2,
                  transform: isWinner
                    ? "scale(1.1) translateY(-10px)"
                    : "scale(1) translateY(0)",
                  transition: "transform 300ms ease",
                }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700">
                  <div
                    className={`text-sm font-bold ${
                      isWinner ? "text-yellow-500" : "text-white"
                    }`}
                  >
                    {shownMultiplier}×
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          ref={stickRef}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="h-36 w-1 rounded-full bg-yellow-500 max-lg:h-32 lg:h-48" />
          <div className="-ml-1.5 -mt-2 h-4 w-4 rounded-full bg-white" />
        </div>
      </div>

      {showCountdownBar ? (
        <div className="absolute bottom-3 w-full px-4">
          <div className="mx-auto mb-2 max-w-4xl text-center text-lg text-white">
            Next round in: {timeLeft}s
          </div>
          <div className="mx-auto h-2.5 w-full max-w-4xl overflow-hidden rounded-full bg-gray-700">
            <motion.div
              className="h-2.5 bg-green-600"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25, ease: "linear" }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Game;
