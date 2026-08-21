/* eslint-disable */
import BetAmount from "../../Frame/BetAmount";
import {
  GameLabeledSliderRow,
  GameRiskAutoRow,
  RISK_LOW_MEDIUM_HIGH,
} from "../../Frame/GamePanelControls";

const MIN_ROWS = 8;
const MAX_ROWS = 16;

const fieldLabel = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-label";

const LeftSection = ({
  theatreMode,
  setBetMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  risk,
  setRisk,
  rows,
  setRows,
  bettingStarted,
  handleBetClick,
  handleAutoBet,
  startAutoBet,
  isBallInMotion,
}) => {
  const boardLocked = isBallInMotion || startAutoBet;
  const bettingLocked = startAutoBet;
  const modeSwitchDisabled = bettingLocked;

  return (
    <div
      className={`col-span-12 ${
        theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
      } xl:col-span-3 bg-inactive order-2 max-lg:h-fit lg:h-[600px] overflow-auto`}
    >
      <div className="my-4 flex h-full flex-col gap-1 px-3">
        <GameRiskAutoRow
          options={RISK_LOW_MEDIUM_HIGH}
          value={risk}
          onChange={setRisk}
          segmentDisabled={boardLocked}
          betMode={betMode}
          setBetMode={setBetMode}
          modeSwitchDisabled={modeSwitchDisabled}
          className="mb-0 mt-0 shrink-0"
        />

        <GameLabeledSliderRow
          label="Rows"
          min={MIN_ROWS}
          max={MAX_ROWS}
          value={rows}
          onChange={setRows}
          disabled={boardLocked}
          ariaLabel="Plinko rows"
        />

        <div className="order-2 shrink-0">
          <BetAmount
            bet={bet}
            setBet={setBet}
            maxBetEnable={maxBetEnable}
            disabled={bettingLocked}
          />
        </div>

        <div className="order-4 flex flex-col gap-1 lg:order-3">
          {betMode === "auto" && (
            <div>
              <label htmlFor="plinko-nbets" className={fieldLabel}>
                Number of bets
              </label>
              <input
                id="plinko-nbets"
                type="number"
                min="1"
                value={nbets}
                disabled={bettingLocked}
                onChange={(e) => !bettingLocked && setNBets(e.target.value)}
                className={`h-10 w-full rounded-lg border border-input bg-secondry px-3 text-sm text-white outline-none transition ${
                  bettingLocked
                    ? "cursor-not-allowed opacity-50"
                    : "hover:border-primary-4 focus:border-button-primary"
                }`}
              />
            </div>
          )}
        </div>

        {betMode === "manual" ? (
          <button
            type="button"
            disabled={!bettingStarted || bettingLocked}
            onClick={() => !bettingLocked && handleBetClick()}
            className={`order-3 w-full rounded-lg py-3 text-base font-bold transition lg:order-4 lg:mt-auto ${
              !bettingStarted || bettingLocked
                ? "cursor-not-allowed bg-[#2a2a2a] text-white/50"
                : "cursor-pointer bg-button-primary text-black hover:brightness-110 active:scale-[0.98]"
            }`}
          >
            Bet
          </button>
        ) : (
          <button
            type="button"
            disabled={bettingLocked}
            onClick={handleAutoBet}
            className={`order-3 w-full rounded-lg py-3 text-base font-bold transition lg:order-4 lg:mt-auto ${
              bettingLocked
                ? "cursor-not-allowed bg-[#2a2a2a] text-white/50"
                : "cursor-pointer bg-button-primary text-black hover:brightness-110 active:scale-[0.98]"
            }`}
          >
            {startAutoBet ? "Auto betting…" : "Start autobet"}
          </button>
        )}
      </div>
    </div>
  );
};

export default LeftSection;
