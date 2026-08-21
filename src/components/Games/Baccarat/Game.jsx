import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Card from "./Card";
import { BACCARAT_SPOTS } from "./odds";
import "./baccarat.css";

const DEAL_GAP_MS = 520;
const FLY_MS = 420;

const CardBack = () => (
  <div className="relative flex h-28 w-20 items-center justify-center overflow-hidden rounded-md border-2 border-white bg-blue-600 shadow-lg md:h-36 md:w-24">
    <div className="absolute inset-0 bg-black/30" />
    <p className="relative z-10 text-center text-[0.65rem] font-medium leading-tight text-white md:text-[0.9rem]">
      Khel
      <br />
      Guru
    </p>
  </div>
);

const DealtCard = ({ card, isWinner, fromShoe }) => (
  <motion.div
    initial={
      fromShoe
        ? { opacity: 0.95, scale: 0.4, x: 140, y: -170, rotate: -22 }
        : false
    }
    animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
    transition={{ duration: FLY_MS / 1000, ease: "easeOut" }}
    className={isWinner ? "baccarat-glow" : ""}
  >
    <Card
      medium
      value={card.value}
      suit={card.suit}
      isRed={card.suit === "♥" || card.suit === "♦"}
    />
  </motion.div>
);

const withMeta = (cards = [], prefix) =>
  cards.map((card, index) => ({
    ...card,
    id: `${prefix}-${index}-${card.value}${card.suit}`,
  }));

const handScore = (cards) => {
  let score = 0;
  for (const card of cards) {
    if (["J", "Q", "K", "10"].includes(card.value)) score += 0;
    else if (card.value === "A") score += 1;
    else score += parseInt(card.value, 10) || 0;
  }
  return score % 10;
};

const dealSequence = (playerCards, bankerCards) => {
  const player = withMeta(playerCards, "p");
  const banker = withMeta(bankerCards, "b");
  const steps = [];
  const n = Math.max(player.length, banker.length);
  for (let i = 0; i < n; i += 1) {
    if (player[i]) steps.push({ hand: "player", card: player[i] });
    if (banker[i]) steps.push({ hand: "banker", card: banker[i] });
  }
  return steps;
};

const winnerLabel = {
  player: "Player Wins",
  banker: "Banker Wins",
  tie: "Tie",
};

const oddsLabel = {
  player: "1:1",
  banker: "0.95:1",
  tie: "8:1",
};

const Hand = ({ title, score, cards, glow }) => (
  <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
    <div className="rounded bg-[#2f4553] px-2 py-1 text-[0.65rem] font-semibold md:px-3 md:text-sm">
      {title}: {score}
    </div>
    <div className="flex min-h-[6.5rem] items-end justify-center md:min-h-[9.5rem]">
      {cards.length === 0 ? (
        <div className="h-[6.25rem] w-[4.25rem] rounded-md border border-dashed border-white/20 md:h-[9rem] md:w-[6rem]" />
      ) : (
        cards.map((card, index) => (
          <div
            key={card.id}
            className={index === 0 ? "" : "-ml-5 md:-ml-8"}
            style={{ zIndex: index + 1 }}
          >
            <DealtCard card={card} isWinner={glow} fromShoe />
          </div>
        ))
      )}
    </div>
  </div>
);

const Game = ({
  chipBet,
  playerBet,
  setPlayerBet,
  bankerBet,
  setBankerBet,
  tieBet,
  setTieBet,
  selectedSpots = { player: false, tie: false, banker: false },
  setSelectedSpots = () => {},
  betStarted = false,
  dealtRound = null,
  onDealComplete = () => {},
}) => {
  const [visiblePlayer, setVisiblePlayer] = useState([]);
  const [visibleBanker, setVisibleBanker] = useState([]);
  const [dealDone, setDealDone] = useState(false);
  const finishedDealRef = useRef(null);

  const dealId = dealtRound?.gameId || null;
  const steps = useMemo(
    () =>
      dealtRound
        ? dealSequence(dealtRound.playerCards, dealtRound.bankerCards)
        : [],
    [dealtRound]
  );

  useEffect(() => {
    setVisiblePlayer([]);
    setVisibleBanker([]);
    setDealDone(false);

    if (!dealId || steps.length === 0) {
      if (!dealId) finishedDealRef.current = null;
      return undefined;
    }

    const timers = [];
    steps.forEach((step, index) => {
      timers.push(
        setTimeout(() => {
          if (step.hand === "player") {
            setVisiblePlayer((prev) => [...prev, step.card]);
          } else {
            setVisibleBanker((prev) => [...prev, step.card]);
          }
        }, index * DEAL_GAP_MS)
      );
    });

    timers.push(
      setTimeout(() => {
        setDealDone(true);
        if (finishedDealRef.current !== dealId) {
          finishedDealRef.current = dealId;
          onDealComplete();
        }
      }, steps.length * DEAL_GAP_MS + FLY_MS)
    );

    return () => timers.forEach(clearTimeout);
  }, [dealId, steps, onDealComplete]);

  const winner = dealDone ? dealtRound?.winner || null : null;
  const playerScore = handScore(visiblePlayer);
  const bankerScore = handScore(visibleBanker);
  const returned = (dealtRound?.bets || []).reduce(
    (sum, bet) => sum + (Number(bet.payout) || 0),
    0
  );

  const tableBusy = betStarted || Boolean(dealId);

  const placeBet = (key) => {
    if (tableBusy) return;
    const chip = Number(chipBet) || 0;
    if (key === "player") setPlayerBet((prev) => prev + chip);
    if (key === "tie") setTieBet((prev) => prev + chip);
    if (key === "banker") setBankerBet((prev) => prev + chip);
    setSelectedSpots((prev) => ({ ...prev, [key]: true }));
  };

  const stakeFor = { player: playerBet, tie: tieBet, banker: bankerBet };

  return (
    <div className="relative flex h-auto w-full flex-col overflow-hidden font-mono text-white md:h-full md:min-h-[520px]">
      <div className="relative flex min-h-[15.5rem] flex-1 flex-col justify-end overflow-hidden px-2 pb-3 pt-4 md:min-h-[22rem] md:px-6 md:pb-4 md:pt-8">
        <div className="pointer-events-none absolute -right-10 -top-16 z-10 md:-right-12 md:-top-[5.25rem]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute right-0 top-0"
              style={{
                zIndex: 10 - i,
                transform: `translateY(-${i * 2}px) rotate(${i % 2 === 0 ? i : -i}deg)`,
              }}
            >
              <CardBack />
            </div>
          ))}
        </div>

        <div className="flex items-end justify-center gap-6 md:gap-16">
          <Hand
            title="Player"
            score={playerScore}
            cards={visiblePlayer}
            glow={winner === "player" || winner === "tie"}
          />
          <Hand
            title="Banker"
            score={bankerScore}
            cards={visibleBanker}
            glow={winner === "banker" || winner === "tie"}
          />
        </div>

        {winner && (
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md px-3 py-1.5 text-center shadow-lg ${
              winner === "player"
                ? "bg-green-700 text-white"
                : winner === "tie"
                  ? "bg-sky-700 text-white"
                  : "bg-red-700 text-white"
            }`}
          >
            <p className="text-sm font-bold md:text-lg">{winnerLabel[winner]}</p>
            <p className="text-[0.65rem] text-white/80 md:text-xs">
              {oddsLabel[winner]}
            </p>
            <p className="text-sm font-semibold md:text-base">
              ${returned.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[#1a2c38] px-2 py-2 md:px-3 md:py-3">
        <div className="grid grid-cols-3 gap-1.5 md:gap-3">
          {BACCARAT_SPOTS.map((spot) => (
            <button
              key={spot.key}
              type="button"
              disabled={tableBusy}
              onClick={() => placeBet(spot.key)}
              className="relative flex min-w-0 flex-col items-center justify-center rounded border border-[#2f4553] bg-[#1a2c38] px-1 py-2 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 md:py-3"
            >
              {selectedSpots[spot.key] && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 md:h-2.5 md:w-2.5" />
              )}
              <span className="text-[0.7rem] font-semibold md:text-sm">
                {spot.label}
              </span>
              <span className="text-[0.6rem] text-gray-400 md:text-xs">
                {spot.odds}
              </span>
              <span className="text-[0.65rem] md:text-sm">
                ${Number(stakeFor[spot.key] || 0).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Game;
