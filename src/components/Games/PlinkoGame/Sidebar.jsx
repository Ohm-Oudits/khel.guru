/* eslint-disable */
import BetAmount from "../../Frame/BetAmount";
import NumberOfBets from "../../Frame/NumberOfBets";
import {
  GameLabeledSegmentRow,
  PLINKO_RISK_OPTIONS,
} from "../../Frame/GamePanelControls";

const MIN_ROWS = 8;
const MAX_ROWS = 16;
const ROW_OPTIONS = Array.from(
  { length: MAX_ROWS - MIN_ROWS + 1 },
  (_, index) => {
    const count = MIN_ROWS + index;
    return {
      value: count,
      label: String(count),
      shortLabel: String(count),
      tone: "neutral",
    };
  }
);

const LeftSection = ({
  theatreMode,
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

  return (
    <div
      className={`col-span-12 ${
        theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
      } xl:col-span-3 bg-inactive order-2 max-lg:h-fit lg:h-[600px] overflow-auto`}
    >
        <div className="my-4 flex flex-col px-3">
        <GameLabeledSegmentRow
          label="Risk"
          options={PLINKO_RISK_OPTIONS}
          value={risk}
          onChange={setRisk}
          disabled={boardLocked}
          className="mb-0 mt-0 shrink-0"
        />

        <GameLabeledSegmentRow
          label="Rows"
          options={ROW_OPTIONS}
          value={rows}
          onChange={(next) => setRows(Number(next))}
          disabled={boardLocked}
          className="mb-1 mt-1 shrink-0"
          ariaLabel="Plinko rows"
        />

        <div className="w-full">
          <BetAmount
            bet={bet}
            setBet={setBet}
            maxBetEnable={maxBetEnable}
            disabled={bettingLocked}
          />
        </div>

        {betMode === "auto" && (
          <div className="w-full">
            <NumberOfBets
              nbets={nbets}
              setNBets={setNBets}
              disabled={bettingLocked}
              id="plinko-nbets"
            />
          </div>
        )}

        {betMode === "manual" ? (
          <button
            type="button"
            disabled={!bettingStarted || bettingLocked}
            onClick={() => !bettingLocked && handleBetClick()}
            className={`mt-3 w-full rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
              !bettingStarted || bettingLocked
                ? "cursor-not-allowed bg-[#2a2a2a] text-white/50"
                : "cursor-pointer bg-button-primary text-black hover:brightness-110 active:scale-[0.98]"
            }`}
          >
            Place Bet
          </button>
        ) : (
          <button
            type="button"
            disabled={bettingLocked}
            onClick={handleAutoBet}
            className={`mt-3 w-full rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
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
