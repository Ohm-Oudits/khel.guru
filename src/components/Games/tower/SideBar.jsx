import BetAmount from "../../Frame/BetAmount";
import NumberOfBets from "../../Frame/NumberOfBets";
import {
  GameDifficultySelectRow,
  GameLabeledSegmentRow,
  TOWER_DIFFICULTY_OPTIONS,
} from "../../Frame/GamePanelControls";
import "./tower.css";

const panelBtn =
  "tower-panel-btn flex w-full items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out active:scale-[0.98]";

const SideBar = ({
  theatreMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  bettingStarted,
  Difficulty,
  setDifficulty,
  handleBetstarted,
  handleCheckout,
  canCheckout = false,
  roundLocked,
  startAutoBet,
  handleAutoBet,
  handleRandomBoxes,
  selectedBoxes,
  rows,
  disabled,
}) => {
  const bettingLocked = startAutoBet || disabled || roundLocked;
  const manualBetLocked = bettingStarted || disabled || roundLocked;
  const difficultyLocked = bettingStarted || startAutoBet || disabled || roundLocked;
  const allRowsSelected =
    selectedBoxes.length === rows &&
    new Set(selectedBoxes.map((box) => box.row)).size === rows;
  const autoStartLocked = bettingLocked || !allRowsSelected;

  const difficultyControl = (
    <>
      <div className="lg:hidden">
        <GameLabeledSegmentRow
          label="Difficulty"
          options={TOWER_DIFFICULTY_OPTIONS}
          value={Difficulty}
          onChange={setDifficulty}
          disabled={difficultyLocked}
          className="mb-1 mt-2 shrink-0"
          ariaLabel="Difficulty level"
        />
      </div>
      <div className="hidden lg:block">
        <GameDifficultySelectRow
          label="Difficulty"
          options={TOWER_DIFFICULTY_OPTIONS}
          value={Difficulty}
          onChange={setDifficulty}
          disabled={difficultyLocked}
          className="mb-1 mt-2 shrink-0"
          ariaLabel="Difficulty level"
        />
      </div>
    </>
  );

  return (
    <div
      className={`col-span-12 ${
        theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
      } xl:col-span-3 order-2 max-lg:h-fit lg:h-auto overflow-auto bg-inactive ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div className="tower-panel flex h-full flex-col">
        {betMode === "manual" && (
          <>
            <div className="w-full">
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                disabled={manualBetLocked}
              />
            </div>

            {difficultyControl}

            {bettingStarted && !roundLocked && (
              <button
                type="button"
                className={`${panelBtn} ${
                  canCheckout
                    ? ""
                    : "cursor-not-allowed bg-primary text-white opacity-60"
                }`}
                onClick={handleCheckout}
                disabled={!canCheckout}
              >
                Checkout
              </button>
            )}
            {roundLocked && (
              <button
                type="button"
                className={`${panelBtn} cursor-not-allowed bg-primary text-white opacity-60`}
                disabled
              >
                Place Bet
              </button>
            )}
            {!bettingStarted && !roundLocked && (
              <button type="button" className={panelBtn} onClick={handleBetstarted}>
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
                disabled={bettingLocked}
              />
            </div>

            <div className="w-full">
              <NumberOfBets
                nbets={nbets}
                setNBets={setNBets}
                disabled={bettingLocked}
                id="tower-nbets"
              />
            </div>

            <button
              type="button"
              onClick={handleRandomBoxes}
              disabled={bettingLocked}
              className={`${panelBtn} ${
                bettingLocked
                  ? "cursor-not-allowed bg-primary text-white opacity-60"
                  : ""
              }`}
            >
              Random Boxes
            </button>

            {difficultyControl}

            <button
              type="button"
              onClick={handleAutoBet}
              disabled={autoStartLocked}
              className={`${panelBtn} ${
                autoStartLocked
                  ? "cursor-not-allowed bg-primary text-white opacity-60"
                  : ""
              }`}
            >
              Start Autobet
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SideBar;
