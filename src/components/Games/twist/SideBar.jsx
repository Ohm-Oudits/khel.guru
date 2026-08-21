import BetAmount from "../../Frame/BetAmount";

const panelBtn =
  "flex w-full items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out active:scale-[0.98]";

const SideBar = ({
  theatreMode,
  bet,
  setBet,
  maxBetEnable,
  bettingStarted,
  handlebet,
  totalprofit,
  handleCheckout,
  handlePartialCheckout,
  canCashout,
  cashoutLabel,
  partialCashoutLabel,
  isSpinning,
}) => {
  return (
    <div
      className={`col-span-12 ${
        theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
      } order-2 max-lg:h-fit lg:h-[630px] overflow-auto bg-inactive xl:col-span-3`}
    >
      <div className="twist-panel flex flex-col px-3 py-2 max-lg:py-1 lg:px-3 lg:py-3">
        <BetAmount
          bet={bet}
          setBet={setBet}
          maxBetEnable={maxBetEnable}
          disabled={bettingStarted}
        />

        {canCashout && (
          <div className="mt-2 w-full">
            <label
              htmlFor="totalProfit"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-label"
            >
              Board Value
            </label>
            <input
              type="text"
              value={totalprofit}
              id="totalProfit"
              disabled
              className="h-9 w-full rounded border border-input bg-secondry px-3 text-sm text-white lg:h-10"
            />
          </div>
        )}

        <div className="mt-2 flex w-full gap-2">
          <button
            type="button"
            className={`${panelBtn} px-1.5 text-xs lg:text-sm ${
              canCashout
                ? ""
                : "cursor-not-allowed bg-primary text-white opacity-60"
            }`}
            onClick={handleCheckout}
            disabled={!canCashout}
          >
            {cashoutLabel}
          </button>
          <button
            type="button"
            className={`${panelBtn} px-1.5 text-xs lg:text-sm ${
              canCashout
                ? ""
                : "cursor-not-allowed bg-primary text-white opacity-60"
            }`}
            onClick={handlePartialCheckout}
            disabled={!canCashout}
          >
            {partialCashoutLabel}
          </button>
        </div>
        <button
          type="button"
          className={`${panelBtn} mt-2 ${
            isSpinning
              ? "cursor-not-allowed bg-primary text-white opacity-60"
              : ""
          }`}
          onClick={handlebet}
          disabled={isSpinning}
        >
          Place Bet
        </button>
      </div>
    </div>
  );
};

export default SideBar;
