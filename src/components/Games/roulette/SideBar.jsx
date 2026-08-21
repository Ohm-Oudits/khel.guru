/* eslint-disable react/prop-types */
import NumberOfBets from "../../Frame/NumberOfBets";
import { ChipSelector } from "./comp/ChipSelector";

const SideBar = ({
  theatreMode,
  betMode,
  nbets,
  setNbets,
  bettingStarted,
  handleBetstarted,
  handleAutoBet,
  startAutoBet,
  isDisabled,
  currentBets,
  chipBet,
  setChipBet,
}) => {
  const panelLocked = Boolean(isDisabled) || Boolean(bettingStarted);
  const currentTotalBet = Object.values(currentBets).reduce(
    (sum, amount) => sum + parseFloat(amount),
    0
  );

  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 order-2 max-lg:h-[fit-content] lg:h-[600px] min-w-0 overflow-auto bg-inactive`}
      >
        <div className="my-4 px-3 flex flex-col">
          <ChipSelector
            chipBet={chipBet}
            setChipBet={setChipBet}
            disabled={panelLocked}
          />

          {betMode === "manual" && (
            <button
              className={`mt-3 flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
                panelLocked
                  ? "cursor-not-allowed bg-primary text-white opacity-60"
                  : "cursor-pointer bg-button-primary text-black active:scale-90"
              }`}
              onClick={handleBetstarted}
              disabled={panelLocked}
            >
              {isDisabled
                ? "Spinning..."
                : bettingStarted
                  ? "Betting..."
                  : "Place Bet"}
            </button>
          )}

          {betMode === "auto" && (
            <>
              <NumberOfBets
                nbets={nbets}
                setNBets={(value) => {
                  if (value === "") {
                    setNbets("");
                    return;
                  }
                  const numValue = parseInt(value, 10);
                  if (!Number.isNaN(numValue)) {
                    setNbets(numValue);
                  }
                }}
                disabled={startAutoBet || panelLocked}
              />

              <button
                onClick={handleAutoBet}
                disabled={startAutoBet || panelLocked}
                className={`mt-3 flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
                  startAutoBet || panelLocked
                    ? "cursor-not-allowed bg-primary text-white opacity-60"
                    : "cursor-pointer bg-button-primary text-black active:scale-90"
                }`}
              >
                {isDisabled
                  ? "Spinning..."
                  : startAutoBet
                    ? `Auto Betting (${(currentTotalBet * nbets).toFixed(6)})`
                    : "Start Autobet"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SideBar;
