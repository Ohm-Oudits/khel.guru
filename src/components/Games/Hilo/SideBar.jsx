import { FaGreaterThanEqual, FaLessThanEqual } from "react-icons/fa";
import { FiChevronsRight } from "react-icons/fi";
import { getHiloOdds } from "./constant";

const ActionButton = ({ onClick, icon, label, percent }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded bg-[#2f4553] px-1 py-2 text-white transition hover:bg-[#3a5566] active:scale-95"
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
  setBetMode,
  betMode,
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
        <div className="sticky top-0 z-[1] rounded-md bg-inactive">
          <div className="mb-2 grid w-full grid-cols-1 gap-1 rounded-full bg-primary p-1">
            <div
              onClick={() => setBetMode("manual")}
              className={`${
                betMode === "manual" ? "bg-inactive scale-95" : ""
              } col-span-1 flex cursor-pointer items-center justify-center rounded-full py-2 font-semibold text-white transition-all duration-300 ease-in-out active:scale-90`}
            >
              Manual
            </div>
          </div>
        </div>

        <div className="my-2 w-full">
          <div className="mb-[-4px] flex w-full items-center justify-between pl-[2px] font-semibold text-label">
            <label htmlFor="betAmount">Bet Amount</label>
            <h1 className="text-sm">$0.00</h1>
          </div>
          <div className="mt-1 flex w-full rounded bg-inactive shadow-md">
            <div className="relative w-full">
              <input
                type="text"
                value={bet}
                disabled={bettingStarted}
                id="betAmount"
                onChange={(e) => setBet(e.target.value)}
                className="h-full w-full rounded bg-secondry px-2 pr-6 text-white outline-none border border-inactive hover:border-primary-4"
              />
              <div className="absolute right-2 top-1.5">
                <svg fill="none" viewBox="0 0 96 96" className="svg-icon">
                  <title></title>
                  <path
                    d="M95.895 48.105C95.895 74.557 74.451 96 48 96 21.548 96 .105 74.556.105 48.105.105 21.653 21.548.21 48 .21c26.451 0 47.895 21.443 47.895 47.895Z"
                    fill="#F7931A"
                  ></path>
                  <path
                    d="M69.525 42.18c.93-6.27-3.84-9.645-10.38-11.895l2.115-8.505-5.16-1.29-2.1 8.28c-1.365-.345-2.76-.66-4.14-.975l2.1-8.295-5.175-1.29-2.115 8.49c-1.125-.255-2.235-.51-3.3-.78l-7.14-1.785-1.365 5.52s3.84.885 3.75.93a2.763 2.763 0 0 1 2.414 3.011l.001-.01-2.415 9.69c.213.049.394.106.568.174l-.028-.01-.54-.135-3.39 13.5a1.879 1.879 0 0 1-2.383 1.226l.013.004-3.765-.93L24.525 63l6.735 1.665 3.69.96-2.145 8.595 5.175 1.29 2.115-8.505c1.41.375 2.775.735 4.125 1.065l-2.115 8.475 5.175 1.29 2.13-8.58c8.835 1.665 15.465.99 18.255-6.99 2.25-6.42-.105-10.125-4.755-12.54 3.39-.72 5.925-2.955 6.615-7.545ZM57.69 58.755c-1.59 6.435-12.405 3-15.915 2.085L44.61 49.5c3.51.825 14.76 2.565 13.08 9.255Zm1.605-16.665c-1.5 5.85-10.5 2.865-13.38 2.145l2.58-10.32c2.91.72 12.315 2.085 10.8 8.175Z"
                    fill="#fff"
                  ></path>
                </svg>
              </div>
            </div>
            <div className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap bg-grey-400 px-[1rem] py-[0.8125rem] text-sm font-semibold leading-none text-white hover:bg-grey-300">
              1/2
            </div>
            <div className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap bg-grey-400 px-[1rem] py-[0.8125rem] text-sm font-semibold leading-none text-white hover:bg-grey-300">
              2x
            </div>
            {maxBetEnable && (
              <div className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap bg-grey-400 px-[1rem] py-[0.8125rem] text-sm font-semibold leading-none text-white hover:bg-grey-300">
                Max
              </div>
            )}
          </div>
        </div>

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
              className="flex h-full min-w-0 flex-col items-center justify-center gap-0.5 rounded bg-[#2f4553] px-1 py-2 text-white transition hover:bg-[#3a5566] active:scale-95"
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
            className="mt-2 flex w-full items-center justify-center rounded bg-button-primary py-2 text-lg font-semibold text-black transition-all duration-300 ease-in-out active:scale-95"
            onClick={handleCheckout}
          >
            Checkout {Number(roundMultiplier).toFixed(2)}x
          </button>
        ) : (
          <button
            type="button"
            disabled={betLocked}
            className="mt-2 flex w-full items-center justify-center rounded bg-button-primary py-2 text-lg font-semibold text-black transition-all duration-300 ease-in-out enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleBet}
          >
            Bet
          </button>
        )}
      </div>
    </div>
  );
};

export default SideBar;
