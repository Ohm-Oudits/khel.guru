/* eslint-disable react/prop-types */
import NumberOfBets from "../../Frame/NumberOfBets";
import BetAmount from "../../Frame/BetAmount";
import {
  DIFFICULTY_LOW_MEDIUM_HIGH,
  GameLabeledSegmentRow,
} from "../../Frame/GamePanelControls";

const SideBar = ({
  theatreMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  bettingStarted,
  roundLocked,
  value,
  handleBetClick,
  handleCheckout,
  difficulty,
  setDifficulty,
  handleAutoBet,
  startAutoBet,
  autoMultipyTarget,
  setAutoMultipyTarget,
}) => {
  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-auto`}
      >
        <div className="my-4 flex flex-col px-3">
          {betMode === "manual" && (
            <>
              <div className="w-full">
                <BetAmount
                  bet={bet}
                  setBet={setBet}
                  maxBetEnable={maxBetEnable}
                  disabled={bettingStarted}
                />
              </div>

              {bettingStarted && (
                <div className="mb-2 mt-1 w-full">
                  <label
                    htmlFor="totalProfit"
                    className="mb-1.5 block pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label"
                  >
                    Total Profit
                  </label>
                  <input
                    type="text"
                    value={bet * value}
                    id="totalprofit"
                    disabled
                    className="mt-1 w-full rounded bg-secondry px-3 py-2.5 text-white outline-none border border-input"
                  />
                </div>
              )}

              <GameLabeledSegmentRow
                label="Difficulty"
                options={DIFFICULTY_LOW_MEDIUM_HIGH}
                value={difficulty}
                onChange={setDifficulty}
                disabled={bettingStarted || startAutoBet}
                className="mb-1 mt-2 shrink-0"
                ariaLabel="Difficulty level"
              />

              {bettingStarted && !roundLocked && (
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out active:scale-90"
                  onClick={handleCheckout}
                >
                  Checkout
                </button>
              )}

              {roundLocked && (
                <div className="mt-3 flex w-full items-center justify-center rounded-[1rem] bg-primary py-2.5 text-[0.98rem] font-semibold text-white opacity-60">
                  Settling...
                </div>
              )}

              {!bettingStarted && !roundLocked && (
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out active:scale-90"
                  onClick={handleBetClick}
                >
                  Place Bet
                </button>
              )}
            </>
          )}

          {betMode === "auto" && (
            <>
              <div className="w-full">
                <BetAmount
                  bet={bet}
                  setBet={setBet}
                  maxBetEnable={maxBetEnable}
                  disabled={startAutoBet}
                />
              </div>

              <div className="w-full">
                <NumberOfBets
                  nbets={nbets}
                  setNBets={setNBets}
                  disabled={startAutoBet}
                />
              </div>

              <div className="my-2 w-full">
                <div className="mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label">
                  Target Multiplier
                </div>
                <div className="mt-1 rounded-[1.15rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(20,241,149,0.09),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,215,0,0.08),_transparent_26%),linear-gradient(180deg,_rgba(20,25,23,0.96),_rgba(12,16,14,0.98))] p-1 shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
                  <div className="relative">
                    <input
                      type="number"
                      id="parachuteTargetMultiplier"
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
              </div>

              <GameLabeledSegmentRow
                label="Difficulty"
                options={DIFFICULTY_LOW_MEDIUM_HIGH}
                value={difficulty}
                onChange={setDifficulty}
                disabled={bettingStarted || startAutoBet}
                className="mb-1 mt-1 shrink-0"
                ariaLabel="Difficulty level"
              />

              <button
                type="button"
                onClick={handleAutoBet}
                disabled={startAutoBet || roundLocked}
                className={`mt-3 flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
                  startAutoBet || roundLocked
                    ? "cursor-not-allowed bg-primary text-white opacity-60"
                    : "cursor-pointer bg-button-primary text-black active:scale-90"
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
