import { CardBack, FlippableCard } from "./Components";

const SHOE = [3, 11, 7];

const PLAYER_TOP = 4;
const DEALER_TOP = 56;
const SPLIT_TOP = 8;
const CARD_STAGGER = 4.5;

const formatMultiplier = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00x";
  return `${n.toFixed(2)}x`;
};

const resultTone = (result) => {
  if (result === "win" || result === "blackjack") return "bg-green-500 text-black";
  if (result === "lose") return "bg-red-500 text-white";
  if (result) return "bg-orange-500 text-black";
  return "bg-gray-50/10";
};

const Game = ({
  userCards,
  dealerCards,
  userValue,
  dealerValue,
  userResult,
  isSplit,
  activeHand,
  splitHands,
  splitValues,
  splitResults,
  settlement,
  phase,
}) => {
  const complete = phase === "complete";
  const showBadge = complete && settlement;
  const winTone =
    Number(settlement?.multiplier) > 1
      ? "bg-emerald-500 text-black"
      : Number(settlement?.multiplier) === 1
        ? "bg-amber-500 text-black"
        : "bg-red-500 text-white";

  return (
    <div className="relative h-[340px] w-full overflow-hidden text-base text-white max-lg:h-[340px] lg:h-[600px]">
      <div className="pointer-events-none absolute -right-7 -top-9 z-10 lg:-right-10 lg:-top-14">
        {SHOE.map((rand, i) => (
          <div
            key={rand}
            className="absolute right-0 top-0"
            style={{
              zIndex: 10 - i,
              transform: `translate(${-i * 0.35}rem, ${i * 0.14}rem) rotate(${i % 2 === 0 ? i * 2 : -i * 2}deg)`,
            }}
          >
            <CardBack rand={rand} compact />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[46%] z-0 flex w-[74%] max-w-[640px] -translate-x-1/2 -translate-y-1/2 justify-center max-lg:top-[48%] max-lg:w-[82%]">
        <div className="flex w-[78%] flex-col items-center text-center max-lg:w-[86%]">
          <p className="text-[1.65rem] font-black uppercase tracking-[0.04em] text-[rgba(161,170,184,0.28)] max-lg:text-sm">
            Blackjack Pays 3 To 2
          </p>
          <div className="mt-3 h-px w-full bg-[linear-gradient(90deg,rgba(21,46,59,0)_0%,rgba(47,72,89,0.18)_18%,rgba(107,125,142,0.22)_50%,rgba(47,72,89,0.18)_82%,rgba(21,46,59,0)_100%)] max-lg:mt-2" />
          <p className="mt-3 text-[1rem] font-black uppercase tracking-[0.05em] text-[rgba(146,156,170,0.22)] max-lg:mt-2 max-lg:text-[0.8rem]">
            Insurance Pays 2 To 1
          </p>
        </div>
      </div>

      <div className="absolute inset-0">
        {isSplit && (
          <div className="absolute left-1/2 top-1 z-10 flex -translate-x-1/2 gap-2">
            {splitHands.map((_, index) => (
              <div
                key={index}
                className={`rounded px-3 py-1 text-sm ${
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

        {isSplit ? (
          <>
            {splitHands[0]?.map((card, index) => (
              <FlippableCard
                key={card.id || `s0-${index}`}
                card={card}
                position={{
                  top: SPLIT_TOP + index * CARD_STAGGER,
                  left: 14 + index * 6,
                }}
                isFlipped={!card.hidden && card.flipped !== false}
              />
            ))}
            {splitHands[1]?.map((card, index) => (
              <FlippableCard
                key={card.id || `s1-${index}`}
                card={card}
                position={{
                  top: SPLIT_TOP + index * CARD_STAGGER,
                  left: 56 + index * 6,
                }}
                isFlipped={!card.hidden && card.flipped !== false}
              />
            ))}
          </>
        ) : (
          userCards.map((card, index) => (
            <FlippableCard
              key={card.id || `p-${index}`}
              card={card}
              position={{
                top: PLAYER_TOP + index * CARD_STAGGER,
                left: 32 + index * 6,
              }}
              isFlipped={!card.hidden && card.flipped !== false}
            />
          ))
        )}

        {dealerCards.map((card, index) => (
          <FlippableCard
            key={card.id || `d-${index}`}
            card={card}
            position={{
              top: DEALER_TOP + index * CARD_STAGGER,
              left: 32 + index * 6,
            }}
            isFlipped={!card.hidden && card.flipped !== false}
          />
        ))}

        {isSplit ? (
          <>
            <div className="absolute left-[10%] top-1 z-10 max-lg:left-[4%]">
              <h1
                className={`rounded px-3 py-0.5 text-[0.8rem] font-semibold ${resultTone(
                  splitResults[0]
                )}`}
              >
                Hand 1 : {splitValues[0]}
              </h1>
            </div>
            <div className="absolute left-[56%] top-1 z-10 max-lg:left-[50%]">
              <h1
                className={`rounded px-3 py-0.5 text-[0.8rem] font-semibold ${resultTone(
                  splitResults[1]
                )}`}
              >
                Hand 2 : {splitValues[1]}
              </h1>
            </div>
          </>
        ) : null}

        {phase === "insurance" && (
          <p className="absolute left-1/2 top-[42%] z-20 w-[90%] -translate-x-1/2 rounded bg-amber-500/20 px-3 py-1 text-center text-sm text-amber-300">
            Dealer shows Ace — take insurance?
          </p>
        )}

        {showBadge && (
          <div
            className={`absolute left-1/2 top-[38%] z-20 -translate-x-1/2 rounded-md px-4 py-1.5 text-lg font-bold shadow-lg ${winTone}`}
          >
            {formatMultiplier(settlement.multiplier)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
