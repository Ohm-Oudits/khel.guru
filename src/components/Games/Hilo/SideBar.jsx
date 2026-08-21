import { FaGreaterThanEqual, FaLessThanEqual } from "react-icons/fa";
import { FiChevronsRight } from "react-icons/fi";
import BetAmount from "../../Frame/BetAmount";
import { getHiloOdds } from "./constant";

const ActionButton = ({ onClick, icon, label, percent }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded border border-white/10 bg-background-tertiary/95 px-1 py-2 text-text-secondary transition hover:border-brand-primary/25 hover:bg-background-surface hover:text-white active:scale-95"
  >
    <span className="flex items-center gap-1 text-[0.7rem] font-semibold md:text-xs">
      {icon}
      {label}
    </span>
    {percent != null && (
      <span className="text-[0.65rem] text-gray-300">{percent}%</span>
    )}
  </button>
);

const SideBar = ({
  bet,
  setBet,
  maxBetEnable,
  bettingStarted,
  handleBet,
  handleCheckout,
  handleHigh,
  handleLow,
  handleSkip,
  currentCard,
  roundMultiplier = 1,
  betLocked = false,
}) => {
  const odds = getHiloOdds(currentCard?.value);

  return (
    <div className="order-2 col-span-12 flex h-full flex-col overflow-auto border-[#1a2c38] bg-inactive max-md:border-t md:order-1 md:col-span-4 md:border-r md:border-t-0 xl:col-span-3">
      <div className="flex h-full flex-col px-3 py-3 md:py-4">
        <BetAmount
          bet={bet}
          setBet={setBet}
          maxBetEnable={maxBetEnable}
          disabled={bettingStarted || betLocked}
        />

        {bettingStarted && (
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <ActionButton
              onClick={handleHigh}
              icon={<FaGreaterThanEqual size={11} />}
              label="Higher"
              percent={odds.high.percent}
            />
            <ActionButton
              onClick={handleLow}
              icon={<FaLessThanEqual size={11} />}
              label="Lower"
              percent={odds.low.percent}
            />
            <button
              type="button"
              onClick={handleSkip}
              className="flex h-full min-w-0 flex-col items-center justify-center gap-0.5 rounded border border-white/10 bg-background-tertiary/95 px-1 py-2 text-text-secondary transition hover:border-brand-primary/25 hover:bg-background-surface hover:text-white active:scale-95"
            >
              <span className="flex items-center gap-1 text-[0.7rem] font-semibold md:text-xs">
                <FiChevronsRight size={14} />
                Skip
              </span>
            </button>
          </div>
        )}

        {bettingStarted ? (
          <button
            type="button"
            className="mt-2 flex w-full items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out active:scale-95"
            onClick={handleCheckout}
          >
            Checkout {Number(roundMultiplier).toFixed(2)}x
          </button>
        ) : (
          <button
            type="button"
            disabled={betLocked}
            className="mt-2 flex w-full items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleBet}
          >
            Place Bet
          </button>
        )}
      </div>
    </div>
  );
};

export default SideBar;
