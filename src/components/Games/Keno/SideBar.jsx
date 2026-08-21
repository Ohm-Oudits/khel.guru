/* eslint-disable react/prop-types */
import NumberOfBets from "../../Frame/NumberOfBets";
import BetAmount from "../../Frame/BetAmount";
import {
  GameLabeledSegmentRow,
  KENO_RISK_OPTIONS,
} from "../../Frame/GamePanelControls";

const actionBtn =
  "flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.92rem] font-semibold transition-all duration-300 ease-out";

const SideBar = ({
  theatreMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  bettingStarted,
  Risk,
  setRisk,
  handleMineBet,
  valid,
  AutoPick,
  setAutoPick,
  setClearTable,
  startAutoBet,
  handleAutoBet,
  checkedBoxes,
}) => {
  const pickLocked = bettingStarted || startAutoBet;

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

              <GameLabeledSegmentRow
                label="Risk"
                options={KENO_RISK_OPTIONS}
                value={Risk}
                onChange={setRisk}
                disabled={pickLocked}
                className="mb-1 mt-2 shrink-0"
              />

              <ClearAutoPickRow
                locked={pickLocked}
                autoPicking={AutoPick}
                checkedBoxes={checkedBoxes}
                setAutoPick={setAutoPick}
                setClearTable={setClearTable}
              />

              <button
                type="button"
                className={`mt-3 ${actionBtn} ${
                  valid && !bettingStarted
                    ? "cursor-pointer bg-button-primary text-black active:scale-90"
                    : "cursor-not-allowed bg-gray-900 text-white opacity-60"
                }`}
                onClick={() => {
                  if (valid && !bettingStarted) {
                    handleMineBet();
                  }
                }}
              >
                Place Bet
              </button>
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

              <GameLabeledSegmentRow
                label="Risk"
                options={KENO_RISK_OPTIONS}
                value={Risk}
                onChange={setRisk}
                disabled={pickLocked}
                className="mb-1 mt-2 shrink-0"
              />

              <ClearAutoPickRow
                locked={pickLocked}
                autoPicking={AutoPick}
                checkedBoxes={checkedBoxes}
                setAutoPick={setAutoPick}
                setClearTable={setClearTable}
              />

              <button
                type="button"
                className={`mt-3 ${actionBtn} ${
                  valid && !startAutoBet
                    ? "cursor-pointer bg-button-primary text-black active:scale-90"
                    : "cursor-not-allowed bg-gray-900 text-white opacity-60"
                }`}
                onClick={handleAutoBet}
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

const ClearAutoPickRow = ({
  locked,
  autoPicking,
  checkedBoxes,
  setAutoPick,
  setClearTable,
}) => {
  const canClear = checkedBoxes.length > 0 && !locked;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        className={`${actionBtn} ${
          canClear
            ? "cursor-pointer bg-button-primary text-black active:scale-90"
            : "cursor-not-allowed bg-primary text-white opacity-60"
        }`}
        onClick={() => {
          if (!canClear) return;
          setClearTable(true);
          setTimeout(() => {
            setClearTable(false);
          }, 100);
        }}
      >
        Clear
      </button>
      <button
        type="button"
        className={`${actionBtn} ${
          locked
            ? "cursor-not-allowed bg-primary text-white opacity-60"
            : "cursor-pointer bg-button-primary text-black active:scale-90"
        }`}
        onClick={() => {
          if (!locked) {
            setAutoPick(true);
          }
        }}
      >
        {autoPicking ? "Picking…" : "Auto Pick"}
      </button>
    </div>
  );
};

export default SideBar;
