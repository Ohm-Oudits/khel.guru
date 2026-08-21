import NumberOfBets from "../../Frame/NumberOfBets";
import BetAmount from "../../Frame/BetAmount";
import {
  GameLabeledSegmentRow,
  RISK_LOW_MEDIUM_HIGH,
} from "../../Frame/GamePanelControls";

const SEGMENT_OPTIONS = [10, 20, 30, 40, 50].map((count) => ({
  value: count,
  label: String(count),
  shortLabel: String(count),
  tone: "neutral",
}));

const SideBar = ({
  theatreMode,
  setBet,
  nbets,
  setNBets,
  betMode,
  bet,
  maxBetEnable,
  riskSection,
  segmentSection,
  risk,
  setRisk,
  segment,
  setSegment,
  bettingStarted,
  handleMineBet,
  autoStart,
  handleAutoBet,
}) => {
  const isAuto = betMode === "auto";

  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-auto`}
      >
        <div className="my-4 flex flex-col px-3">
          <div className="w-full">
            <BetAmount
              bet={bet}
              setBet={setBet}
              maxBetEnable={maxBetEnable}
              disabled={isAuto ? autoStart : bettingStarted}
            />
          </div>

          {isAuto && (
            <div className="w-full">
              <NumberOfBets
                nbets={nbets}
                setNBets={setNBets}
                disabled={autoStart}
              />
            </div>
          )}

          {riskSection && (
            <GameLabeledSegmentRow
              label="Risk"
              options={RISK_LOW_MEDIUM_HIGH}
              value={risk}
              onChange={setRisk}
              disabled={bettingStarted || autoStart}
              className="mb-2 mt-2 shrink-0"
            />
          )}

          {segmentSection && (
            <GameLabeledSegmentRow
              label="Segments"
              options={SEGMENT_OPTIONS}
              value={segment}
              onChange={(next) => setSegment(Number(next))}
              disabled={bettingStarted || autoStart}
              className="mb-1 mt-1 shrink-0"
              ariaLabel="Number of segments"
            />
          )}

          {isAuto ? (
            <button
              type="button"
              disabled={autoStart}
              onClick={handleAutoBet}
              className={`mt-3 flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out ${
                autoStart
                  ? "cursor-not-allowed bg-gray-600"
                  : "cursor-pointer bg-button-primary active:scale-90"
              }`}
            >
              {autoStart ? "Autobetting in Progress..." : "Start Autobet"}
            </button>
          ) : (
            <button
              type="button"
              disabled={bettingStarted}
              className={`mt-3 flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
                bettingStarted
                  ? "cursor-not-allowed bg-gray-600 text-white opacity-60"
                  : "cursor-pointer bg-button-primary text-black active:scale-90"
              }`}
              onClick={bettingStarted ? undefined : handleMineBet}
            >
              {bettingStarted ? "Betting..." : "Place Bet"}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default SideBar;
