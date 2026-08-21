/* eslint-disable */
import BetAmount from "../../Frame/BetAmount";
import NumberOfBets from "../../Frame/NumberOfBets";
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
  isAutoBetting,
}) => {
  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[650px] overflow-auto`}
      >
        <div className="my-4 px-3 flex flex-col">
          {betMode === "manual" && (
            <>
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
              />

              {/* Bet button */}
              <div
                className={`order-2 max-md:mb-2 md:order-last flex w-full items-center justify-center mx-auto mt-3 max-lg:mt-4 rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
                  bettingStarted
                    ? "bg-primary text-white cursor-not-allowed opacity-60"
                    : "bg-button-primary text-black cursor-pointer active:scale-90"
                }`}
                onClick={() => {
                  if (!bettingStarted) {
                    handleBetClick();
                  }
                }}
              >
                Place Bet
              </div>
            </>
          )}

          {betMode === "auto" && (
            <>
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
              />

              <NumberOfBets
                nbets={nbets}
                setNBets={setNBets}
                disabled={startAutoBet || isAutoBetting}
              />

              {/* Bet button */}
              <button
                onClick={handleAutoBet}
                disabled={startAutoBet || isAutoBetting}
                className={`order-last max-md:mb-2 md:order-last transition-all duration-300 ease-out flex items-center justify-center w-full mx-auto py-2.5 mt-4 max-lg:mt-4 rounded-[1rem] text-[0.98rem] font-semibold text-black ${
                  startAutoBet || isAutoBetting
                    ? "bg-primary text-white cursor-not-allowed opacity-50"
                    : "bg-button-primary active:scale-90 cursor-pointer"
                }`}
              >
                {isAutoBetting ? "Auto Betting..." : "Start Autobet"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LeftSection;
