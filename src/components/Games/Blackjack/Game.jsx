import { CardBack, FlippableCard } from "./Components";

const SHOE = [3, 11, 7];

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
    <div className="relative w-full overflow-hidden text-base text-white h-[340px] max-lg:h-[340px] lg:h-[600px]">
      <div className="absolute right-4 top-12 z-10 hidden lg:block xl:right-10">
        {SHOE.map((rand, i) => (
          <div
            key={rand}
            className="absolute"
            style={{
              zIndex: 10 - i,
              transform: `rotate(${i % 2 === 0 ? i * 2 : -i * 2}deg)`,
            }}
          >
            <CardBack top="75%" rand={rand} compact />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 top-10 bottom-0 max-lg:top-11 lg:top-12">
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
                  top: 10 + index * 5,
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
                  top: 10 + index * 5,
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
                top: 8 + index * 5,
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
              top: 52 + index * 5,
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
        ) : (
          <div className="absolute left-[8%] top-1 z-10 max-lg:left-[3%]">
            <h1
              className={`rounded px-3 py-0.5 text-[0.8rem] font-semibold ${resultTone(
                userResult
              )}`}
            >
              Player: {userValue}
            </h1>
          </div>
        )}

        <div className="absolute left-[8%] top-[46%] z-10 max-lg:left-[3%]">
          <h1 className="rounded bg-gray-50/10 px-3 py-0.5 text-[0.8rem] font-semibold">
            Dealer: {dealerValue}
          </h1>
        </div>

        <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-[5] hidden text-center text-[0.8rem] font-semibold text-zinc-400 lg:block">
          <p>Blackjack Pays 3 to 2</p>
          <p className="-mt-0.5">Insurance Pays 2 to 1</p>
        </div>

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
