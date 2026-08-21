/* eslint-disable */
import NumberOfBets from "../../Frame/NumberOfBets";
import BetAmount from "../../Frame/BetAmount";
import { crashReachChancePercent } from "../../../utils/crashFairness";
const SideBar = ({
  theatreMode,
  setBetMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  bettingStarted,
  value,
  handleBetClick,
  handleCheckout,
  disableBet,
  startAutoBet,
  handleAutoBet,
  autoMultipyTarget,
  setAutoMultipyTarget,
  roundRtp = 0.99,
}) => {
  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-auto`}
      >
        <div className="my-4 px-3 flex flex-col">
          {betMode === "manual" && (
            <>
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                disabled={bettingStarted}
              />

              {bettingStarted && (
                <div className="order-10 md:order-2 mb-2 mt-1 w-full">
                  <label
                    htmlFor="totalProfit"
                    className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label"
                  >
                    <h1>Total Profit</h1>
                  </label>
                  <input
                    type="text"
                    value={bet * value - bet}
                    id="totalprofit"
                    disabled
                    className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-3 pr-6 py-2 border border-input hover:border-primary-4"
                  />
                </div>
              )}

              {/* Checkout button */}
              {bettingStarted && (
                <div
                  className={`order-2 max-lg:mb-4 md:order-last transition-all duration-300 ease-in-out transform active:scale-90 flex items-center justify-center w-full mx-auto py-1.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold bg-button-primary text-black cursor-pointer`}
                  onClick={handleCheckout}
                >
                  Cashout
                </div>
              )}

              {/* Bet button */}
              {!bettingStarted && (
                <div
                  className={`order-2 max-md:mb-4 md:order-last flex w-full items-center justify-center mx-auto mt-3 max-lg:mt-4 rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
                    disableBet
                      ? "bg-primary text-white cursor-not-allowed opacity-60"
                      : "bg-button-primary text-black cursor-pointer active:scale-90"
                  }`}
                  onClick={disableBet ? undefined : handleBetClick}
                >
                  {disableBet ? "Waiting" : "Place Bet"}
                </div>
              )}
            </>
          )}

          {betMode === "auto" && (
            <>
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                disabled={startAutoBet}
              />

              <NumberOfBets
                nbets={nbets}
                setNBets={setNBets}
                disabled={startAutoBet}
              />

              <div className="my-2 w-full">
                <div className="mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label">
                  Target Multiplier
                </div>
                <div className="mt-1 rounded-[1.15rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(20,241,149,0.09),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,215,0,0.08),_transparent_26%),linear-gradient(180deg,_rgba(20,25,23,0.96),_rgba(12,16,14,0.98))] p-1 shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
                  <div className="relative">
                    <input
                      type="number"
                      id="crashTargetMultiplier"
                      min="1.01"
                      step="0.01"
                      value={autoMultipyTarget}
                      disabled={startAutoBet}
                      onChange={(e) =>
                        !startAutoBet && setAutoMultipyTarget(e.target.value)
                      }
                      inputMode="decimal"
                      placeholder="1.01"
                      className={`h-10 w-full rounded-[0.95rem] border border-white/10 bg-background-tertiary/95 px-3 pr-10 text-[1.02rem] font-semibold tracking-[0.01em] text-white outline-none transition placeholder:text-text-tertiary focus:border-brand-primary/40 focus:bg-background-surface ${
                        startAutoBet ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                      x
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between px-0.5 text-[11px] text-label">
                  <span>Win Chance</span>
                  <span className="font-semibold tabular-nums text-white">
                    {crashReachChancePercent(autoMultipyTarget, roundRtp).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Bet button */}
              <button
                onClick={handleAutoBet}
                disabled={startAutoBet}
                className={`order-last max-md:mb-2 md:order-last transition-all duration-300 ease-out flex items-center justify-center w-full mx-auto py-2.5 mt-4 max-lg:mt-4 rounded-[1rem] text-[0.98rem] font-semibold text-black cursor-pointer ${
                  startAutoBet || disableBet
                    ? "bg-primary text-white cursor-text"
                    : "bg-button-primary active:scale-90"
                }`}
              >
                Start Autobet
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SideBar;
