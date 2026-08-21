/* eslint-disable */
import BetAmount from "../../Frame/BetAmount";
import {
  GameRiskAutoRow,
  RISK_LOW_MEDIUM_HIGH,
} from "../../Frame/GamePanelControls";

const formatProfit = (bet, multiplier) => {
  const stake = parseFloat(bet);
  const mult = Number(multiplier);
  if (!Number.isFinite(stake) || !Number.isFinite(mult)) return "0.000000";
  return (stake * mult).toFixed(6);
};

const LeftSection = ({
  theatreMode,
  setBetMode,
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
  const modeSwitchDisabled = startAutoBet || bettingStarted;

  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-visible`}
      >
        <div className="my-4 px-3 flex flex-col gap-1 overflow-visible">
          <GameRiskAutoRow
            options={RISK_LOW_MEDIUM_HIGH}
            value={risk}
            onChange={setRisk}
            segmentDisabled={bettingStarted}
            betMode={betMode}
            setBetMode={setBetMode}
            modeSwitchDisabled={modeSwitchDisabled}
          />

          <div className="order-2">
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
                  <div className="order-10 md:order-2 mb-2 mt-1 w-full">
                    <label
                      htmlFor="currentMultiplier"
                      className="flex items-center mb-1 pl-[2px] justify-between w-full text-[11px] font-semibold uppercase tracking-wide text-label"
                    >
                      Current Multiplier
                    </label>
                    <input
                      type="text"
                      value={`${Number(balloonNumber).toFixed(2)}x`}
                      id="currentMultiplier"
                      readOnly
                      disabled
                      className="w-full mt-1 rounded bg-secondry outline-none text-emerald-400 font-semibold px-3 py-2.5 border border-inactive"
                    />
                  </div>

                  <div className="order-10 md:order-2 mb-2 mt-1 w-full">
                    <label
                      htmlFor="totalProfit"
                      className="flex items-center mb-1 pl-[2px] justify-between w-full text-[11px] font-semibold uppercase tracking-wide text-label"
                    >
                      Total Profit
                    </label>
                    <input
                      type="text"
                      value={totalProfit}
                      id="totalProfit"
                      readOnly
                      disabled
                      className="w-full mt-1 rounded bg-secondry outline-none text-white px-3 py-2.5 border border-inactive"
                    />
                  </div>
                </>
              )}

              {bettingStarted && !roundLocked && (
                <>
                  <button
                    type="button"
                    className="order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform active:scale-90 flex items-center justify-center w-full mx-auto py-2.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold bg-button-primary text-black cursor-pointer"
                    onClick={handlePump}
                  >
                    Pump
                  </button>
                  <button
                    type="button"
                    className="order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform active:scale-90 flex items-center justify-center w-full mx-auto py-2.5 mt-2 rounded text-lg font-semibold bg-inactive text-white hover:bg-activeHover cursor-pointer border border-inactive"
                    onClick={handleCheckout}
                  >
                    Checkout
                  </button>
                </>
              )}

              {roundLocked && (
                <div className="order-2 max-md:mb-2 md:order-20 flex items-center justify-center w-full mx-auto py-2.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold bg-primary text-white opacity-60 cursor-not-allowed pointer-events-none">
                  Settling...
                </div>
              )}

              {!bettingStarted && !roundLocked && (
                <button
                  type="button"
                  className="order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform active:scale-90 flex items-center justify-center w-full mx-auto py-2.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold bg-button-primary text-black cursor-pointer"
                  onClick={handleBetClick}
                >
                  Bet
                </button>
              )}
            </>
          )}

          {betMode === "auto" && (
            <>
              <div className="w-full mb-1 order-10 md:order-2">
                <label
                  htmlFor="autoPumps"
                  className="text-[11px] font-semibold uppercase tracking-wide text-label"
                >
                  Pumps Per Round
                </label>
                <input
                  type="number"
                  id="autoPumps"
                  min="1"
                  value={autoPumps}
                  disabled={startAutoBet}
                  onChange={(e) => setAutoPumps(e.target.value)}
                  className="w-full mt-1 rounded bg-secondry outline-none text-white px-3 py-2.5 border border-inactive hover:border-primary-4 disabled:opacity-50"
                />
              </div>

              <div className="w-full mb-1 order-10 md:order-2">
                <label
                  htmlFor="nbets"
                  className="text-[11px] font-semibold uppercase tracking-wide text-label"
                >
                  Number of Bets
                </label>
                <input
                  type="number"
                  id="nbets"
                  min="1"
                  value={nbets}
                  disabled={startAutoBet}
                  onChange={(e) => setNBets(e.target.value)}
                  className="w-full mt-1 rounded bg-secondry outline-none text-white px-3 py-2.5 border border-inactive hover:border-primary-4 disabled:opacity-50"
                />
              </div>

              <button
                type="button"
                onClick={handleAutoBet}
                disabled={startAutoBet || roundLocked}
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform flex items-center justify-center w-full mx-auto py-2.5 mt-4 max-lg:mt-4 rounded text-lg font-semibold text-black cursor-pointer ${
                  startAutoBet || roundLocked
                    ? "bg-primary text-white cursor-not-allowed opacity-60"
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

export default LeftSection;
