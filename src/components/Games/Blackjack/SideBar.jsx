import BetAmount from "../../Frame/BetAmount";

const enabledPanelButtonClass =
  "cursor-pointer bg-button-primary text-black active:scale-90";

const disabledPanelButtonClass =
  "cursor-not-allowed bg-primary text-white opacity-60";

const SideBar = ({
  theatreMode,
  bet,
  setBet,
  maxBetEnable,
  bettingStarted,
  betLocked,
  betButtonLabel,
  playing,
  insuranceOpen,
  handleMineBet,
  handleHit,
  handleStand,
  handleSplit,
  handleDouble,
  handleInsurance,
  split,
  double,
  activeHand,
  splitBets,
  userCards,
}) => {
  const canSplit =
    playing && !split && userCards?.length === 2;
  const isPair =
    userCards?.length === 2 && userCards[0]?.value === userCards[1]?.value;
  const canBet = !bettingStarted && !betLocked && parseFloat(bet) >= 0;
  const actionsOpen = playing && !insuranceOpen;

  const getButtonClass = (enabled) =>
    enabled ? enabledPanelButtonClass : disabledPanelButtonClass;

  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-auto`}
      >
        <div className="my-3 max-lg:my-2 px-3 flex flex-col">
          <>
            {split && (
              <div className="order-1 mb-3 text-center">
                <h2 className="text-white font-semibold">
                  Playing Hand {activeHand + 1}
                </h2>
                <div className="text-sm text-gray-400">
                  {activeHand === 0 ? "Complete this hand first" : "Final hand"}
                </div>
              </div>
            )}

            <BetAmount
              bet={split ? splitBets[activeHand] : bet}
              setBet={setBet}
              maxBetEnable={maxBetEnable}
              disabled={bettingStarted || betLocked}
              maxValue="100.000000"
            />

            {insuranceOpen ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`mt-3 flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.9rem] font-semibold transition-all duration-300 ease-out ${enabledPanelButtonClass}`}
                  onClick={() => handleInsurance(true)}
                >
                  Insurance
                </button>
                <button
                  type="button"
                  className={`mt-3 flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.9rem] font-semibold transition-all duration-300 ease-out ${enabledPanelButtonClass}`}
                  onClick={() => handleInsurance(false)}
                >
                  No Insurance
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`mt-3 flex items-center justify-center w-full mx-auto py-2.5 rounded-[1rem] font-semibold transition-all duration-300 ease-out ${getButtonClass(
                    actionsOpen
                  )} text-[0.9rem]`}
                  onClick={handleHit}
                >
                  Hit
                </div>
                <div
                  className={`mt-3 flex items-center justify-center w-full mx-auto py-2.5 rounded-[1rem] font-semibold transition-all duration-300 ease-out ${getButtonClass(
                    actionsOpen
                  )} text-[0.9rem]`}
                  onClick={handleStand}
                >
                  Stand
                </div>

                <div
                  className={`mb-2 flex items-center justify-center w-full mx-auto py-2.5 rounded-[1rem] font-semibold transition-all duration-300 ease-out ${getButtonClass(
                    canSplit && isPair
                  )} text-[0.9rem]`}
                  onClick={handleSplit}
                >
                  Split
                </div>
                <div
                  className={`mb-2 flex items-center justify-center w-full mx-auto py-2.5 rounded-[1rem] font-semibold transition-all duration-300 ease-out ${getButtonClass(
                    actionsOpen && double
                  )} text-[0.9rem]`}
                  onClick={handleDouble}
                >
                  Double
                </div>
              </div>
            )}

            <button
              onClick={handleMineBet}
              className={`mt-3 flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out ${
                canBet ? enabledPanelButtonClass : disabledPanelButtonClass
              }`}
              disabled={!canBet}
            >
              {betButtonLabel || "Place Bet"}
            </button>
          </>
        </div>
      </div>
    </>
  );
};

export default SideBar;
