/* eslint-disable */
import BetAmount from "../../Frame/BetAmount";
import GameBalanceBadge from "../shared/GameBalanceBadge";

const LeftSection = ({
  theatreMode,
  setBetMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  bettingStarted,
  handleBetClick,
  handleAutoBet,
  startAutoBet,
  enteredMultipler,
  setenteredMultipler,
  gamestarted,
}) => {
  const validateMultiplier = (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 1 || num > 51) {
      return false;
    }
    return true;
  };

  const handleMultiplierChange = (e) => {
    const value = e.target.value;
    if (value === "" || validateMultiplier(value)) {
      setenteredMultipler(value);
    }
  };

  const validateNumberOfBets = (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && num <= 100;
  };

  const handleNumberOfBetsChange = (e) => {
    const value = e.target.value;
    if (value === "" || validateNumberOfBets(value)) {
      setNBets(value);
    }
  };

  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-auto`}
      >
        <div className="my-4 px-3 flex flex-col">
          {/* Manual and auto switch */}
          <div className="sticky top-0 z-[1] bg-inactive py-0 rounded-md">
            <div className="order-[100] max-lg:mt-2 lg:order-1 switch mb-4 w-full bg-primary rounded-full p-1.5 grid grid-cols-2 gap-1">
              <div
                onClick={() => {
                  if (!startAutoBet) {
                    setBetMode("manual");
                  }
                }}
                className={`${
                  betMode === "manual" ? "bg-inactive scale-95" : ""
                } hover:bg-activeHover cursor-pointer col-span-1 flex items-center justify-center py-2 text-white font-semibold rounded-full transition-all duration-300 ease-in-out transform active:scale-90`}
              >
                Manual
              </div>
              <div
                onClick={() => {
                  if (!bettingStarted) {
                    setBetMode("auto");
                  }
                }}
                className={`${
                  betMode === "auto" ? "bg-inactive scale-95" : ""
                } hover:bg-activeHover cursor-pointer col-span-1 flex items-center justify-center py-2 text-white font-semibold rounded-full transition-all duration-300 ease-in-out transform active:scale-90`}
              >
                Auto
              </div>
            </div>
          </div>

          {betMode === "manual" && (
            <div>
              <GameBalanceBadge className="mb-2" />
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
              />
              <div className="mt-4">
                <label className="text-gray-300 font-bold" htmlFor="target">
                  Target Multiplier
                </label>
                <input
                  type="number"
                  value={enteredMultipler}
                  id="target"
                  onChange={handleMultiplierChange}
                  step="0.01"
                  min="1"
                  max="51"
                  disabled={gamestarted}
                  className="w-full rounded bg-secondry outline-none h-10 text-white px-2 pr-6 border border-inactive hover:border-primary-4 disabled:opacity-50"
                  placeholder="Enter multiplier (1-51)"
                />
                <div className="text-sm text-gray-400 mt-1">
                  Enter a multiplier between 1x and 51x
                </div>
              </div>

              {/* Bet button */}
              <button
                disabled={gamestarted || !enteredMultipler || !bet}
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform flex items-center justify-center w-full mx-auto py-1.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold ${
                  gamestarted || !enteredMultipler || !bet
                    ? "bg-primary text-white cursor-not-allowed"
                    : "bg-button-primary text-black cursor-pointer active:scale-90"
                }`}
                onClick={handleBetClick}
              >
                {gamestarted ? "Betting in Progress..." : "Place Bet"}
              </button>
            </div>
          )}

          {betMode === "auto" && (
            <>
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
              />

              {/* Number of bets */}
              <div className="w-full mb-1 order-10 md:order-2 mt-4">
                <label
                  className="font-semibold text-label"
                  htmlFor="numberOfBets"
                >
                  Number of Bets
                </label>
                <input
                  type="number"
                  id="numberOfBets"
                  value={nbets}
                  onChange={handleNumberOfBetsChange}
                  disabled={startAutoBet}
                  min="1"
                  max="100"
                  className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-input hover:border-primary-4 disabled:opacity-50"
                  placeholder="Enter number of bets (1-100)"
                />
                <div className="text-sm text-gray-400 mt-1">
                  Enter number of bets (1-100)
                </div>
              </div>

              {/* Target multiplier for auto bet */}
              <div className="mt-4">
                <label className="text-gray-300 font-bold" htmlFor="autoTarget">
                  Target Multiplier
                </label>
                <input
                  type="number"
                  id="autoTarget"
                  value={enteredMultipler}
                  onChange={handleMultiplierChange}
                  step="0.01"
                  min="1"
                  max="51"
                  disabled={startAutoBet}
                  className="w-full rounded bg-secondry outline-none h-10 text-white px-2 pr-6 border border-inactive hover:border-primary-4 disabled:opacity-50"
                  placeholder="Enter multiplier (1-51)"
                />
                <div className="text-sm text-gray-400 mt-1">
                  Enter a multiplier between 1x and 51x
                </div>
              </div>

              {/* Auto bet button */}
              <button
                onClick={handleAutoBet}
                disabled={startAutoBet || !enteredMultipler || !bet || !nbets}
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform flex items-center justify-center w-full mx-auto py-1.5 mt-4 max-lg:mt-4 rounded text-lg font-semibold ${
                  startAutoBet || !enteredMultipler || !bet || !nbets
                    ? "bg-primary text-white cursor-not-allowed"
                    : "bg-button-primary text-black cursor-pointer active:scale-90"
                }`}
              >
                {startAutoBet
                  ? "Auto Betting in Progress..."
                  : "Start Auto Bet"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LeftSection;
