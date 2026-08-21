/* eslint-disable */
import BetAmount from "../../Frame/BetAmount";
import NumberOfBets from "../../Frame/NumberOfBets";
import {
  GameLabeledSegmentRow,
  RISK_LOW_MEDIUM_HIGH,
} from "../../Frame/GamePanelControls";

const formatProfit = (bet, multiplier) => {
  const stake = parseFloat(bet);
  const mult = Number(multiplier);
  if (!Number.isFinite(stake) || !Number.isFinite(mult)) return "0.000000";
  return (stake * mult).toFixed(6);
};

const fieldLabelClass =
  "mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label";
const fieldShellClass =
  "mt-1 rounded-[1.15rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(20,241,149,0.09),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,215,0,0.08),_transparent_26%),linear-gradient(180deg,_rgba(20,25,23,0.96),_rgba(12,16,14,0.98))] p-1 shadow-[0_16px_34px_rgba(0,0,0,0.28)]";
const fieldInputClass =
  "h-10 w-full rounded-[0.95rem] border border-white/10 bg-background-tertiary/95 px-3 text-[1.02rem] font-semibold tracking-[0.01em] text-white outline-none transition placeholder:text-text-tertiary focus:border-brand-primary/40 focus:bg-background-surface";

const LeftSection = ({
  theatreMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  autoPumps,
  setAutoPumps,
  bettingStarted,
  roundLocked,
  handleBetClick,
  handleAutoBet,
  startAutoBet,
  handlePump,
  handleCheckout,
  risk,
  setRisk,
  balloonNumber,
}) => {
  const panelLocked = bettingStarted || roundLocked;
  const totalProfit = formatProfit(bet, balloonNumber);
  const isAuto = betMode === "auto";
  const riskLocked = bettingStarted || startAutoBet;

  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-visible`}
      >
        <div className="my-4 flex flex-col px-3">
          <GameLabeledSegmentRow
            label="Risk"
            options={RISK_LOW_MEDIUM_HIGH}
            value={risk}
            onChange={setRisk}
            disabled={riskLocked}
            className="mb-1 mt-0 shrink-0"
          />

          <div className="w-full">
            <BetAmount
              bet={bet}
              setBet={setBet}
              maxBetEnable={maxBetEnable}
              disabled={isAuto ? startAutoBet : panelLocked}
            />
          </div>

          {betMode === "manual" && (
            <>
              {bettingStarted && (
                <>
                  <div className="mb-2 mt-1 w-full">
                    <label
                      htmlFor="currentMultiplier"
                      className={fieldLabelClass}
                    >
                      Current Multiplier
                    </label>
                    <input
                      type="text"
                      value={`${Number(balloonNumber).toFixed(2)}x`}
                      id="currentMultiplier"
                      readOnly
                      disabled
                      className="mt-1 w-full rounded bg-secondry px-3 py-2.5 font-semibold text-emerald-400 outline-none border border-inactive"
                    />
                  </div>

                  <div className="mb-2 mt-1 w-full">
                    <label htmlFor="totalProfit" className={fieldLabelClass}>
                      Total Profit
                    </label>
                    <input
                      type="text"
                      value={totalProfit}
                      id="totalProfit"
                      readOnly
                      disabled
                      className="mt-1 w-full rounded bg-secondry px-3 py-2.5 text-white outline-none border border-inactive"
                    />
                  </div>
                </>
              )}

              {bettingStarted && !roundLocked && (
                <>
                  <button
                    type="button"
                    className="mt-3 flex w-full items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out active:scale-90"
                    onClick={handlePump}
                  >
                    Pump
                  </button>
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-center rounded-[1rem] border border-inactive bg-inactive py-2.5 text-[0.98rem] font-semibold text-white transition-all duration-300 ease-out hover:bg-activeHover active:scale-90"
                    onClick={handleCheckout}
                  >
                    Checkout
                  </button>
                </>
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
                <NumberOfBets
                  nbets={nbets}
                  setNBets={setNBets}
                  disabled={startAutoBet}
                  id="nbets"
                />
              </div>

              <div className="my-2 w-full">
                <div className={fieldLabelClass}>Pumps Per Round</div>
                <div className={fieldShellClass}>
                  <input
                    type="number"
                    id="autoPumps"
                    min="1"
                    value={autoPumps}
                    disabled={startAutoBet}
                    onChange={(e) => setAutoPumps(e.target.value)}
                    inputMode="numeric"
                    className={`${fieldInputClass} ${
                      startAutoBet ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  />
                </div>
              </div>

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

export default LeftSection;
