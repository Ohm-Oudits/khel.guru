import BetAmount from "../../Frame/BetAmount";
import NumberOfBets from "../../Frame/NumberOfBets";

const fieldLabelClass =
  "mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label";

const fieldShellClass =
  "rounded-[1.15rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(20,241,149,0.08),_transparent_34%),linear-gradient(180deg,_rgba(20,25,23,0.96),_rgba(12,16,14,0.98))] p-1 shadow-[0_16px_34px_rgba(0,0,0,0.24)]";

const inputClass =
  "h-10 w-full rounded-[0.95rem] border border-white/10 bg-background-tertiary/95 px-3 text-[0.98rem] font-semibold text-white outline-none transition placeholder:text-text-tertiary focus:border-brand-primary/40 focus:bg-background-surface disabled:cursor-not-allowed disabled:opacity-50";

const selectClass = `${inputClass} appearance-none pr-14`;

const primaryButtonClass =
  "flex w-full items-center justify-center rounded-[1rem] py-2.5 text-[0.98rem] font-semibold transition-all duration-300 ease-out";

const secondaryButtonClass =
  "flex w-full items-center justify-center rounded-[1rem] border border-white/10 bg-background-tertiary/95 py-2.5 text-[0.92rem] font-semibold text-white transition-all duration-300 ease-out";

const formatDisplayValue = (value, maximumFractionDigits = 2) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return numericValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};

const FieldCard = ({ label, children }) => (
  <div className="w-full">
    <div className={fieldLabelClass}>{label}</div>
    <div className={fieldShellClass}>{children}</div>
  </div>
);

const SideBar = ({
  theatreMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  bettingStarted,
  mines,
  setMines,
  handleMineBet,
  gems,
  totalprofit,
  handleCheckout,
  handleRandomSelect,
  startAutoBet,
  handleAutoBet,
  gameCheckout,
  disabled,
  connectionStatus,
  stakeBlockReason = null,
  selectedBoxes = [],
}) => {
  const selectedCount = selectedBoxes.length;
  const betLocked = disabled || Boolean(stakeBlockReason);
  const autoStartLocked = startAutoBet || disabled || selectedCount === 0;

  const getButtonText = () => {
    if (connectionStatus === "Connecting") return "Connecting...";
    if (connectionStatus === "Disconnected") return "Disconnected";
    if (stakeBlockReason) return stakeBlockReason;
    return "Place Bet";
  };

  return (
    <div
      className={`col-span-12 ${
        theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
      } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-auto ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex flex-col gap-3 px-3 py-4">
        {betMode === "manual" && (
          <>
            <div className="order-1">
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                disabled={bettingStarted}
              />
            </div>

            <div className="order-2 flex flex-col gap-3">
              <FieldCard label="Mines">
                <div className="relative">
                  <select
                    className={selectClass}
                    value={mines}
                    id="mines"
                    disabled={bettingStarted}
                    onChange={(e) => setMines(Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                    bombs
                  </span>
                </div>
              </FieldCard>

              {bettingStarted && (
                <div className="grid grid-cols-2 gap-2">
                  <FieldCard label="Gems">
                    <input
                      type="text"
                      value={formatDisplayValue(gems || 25 - mines, 0)}
                      disabled
                      className={inputClass}
                    />
                  </FieldCard>
                  <FieldCard label="Total Profit">
                    <input
                      type="text"
                      value={formatDisplayValue(totalprofit, 2)}
                      disabled
                      className={inputClass}
                    />
                  </FieldCard>
                </div>
              )}
            </div>

            <div className="order-last">
              {bettingStarted ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={gameCheckout}
                    className={`${secondaryButtonClass} ${
                      gameCheckout
                        ? "cursor-not-allowed opacity-50"
                        : "hover:border-brand-primary/25 hover:bg-background-surface active:scale-[0.98]"
                    }`}
                    onClick={() => {
                      if (!gameCheckout) {
                        handleRandomSelect();
                      }
                    }}
                  >
                    Pick Random Tile
                  </button>
                  <button
                    type="button"
                    disabled={gameCheckout}
                    className={`${primaryButtonClass} ${
                      gameCheckout
                        ? "cursor-not-allowed bg-primary text-white opacity-60"
                        : "bg-button-primary text-black active:scale-90"
                    }`}
                    onClick={handleCheckout}
                  >
                    Cashout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={betLocked}
                  className={`${primaryButtonClass} ${
                    betLocked
                      ? "cursor-not-allowed bg-primary text-white opacity-60"
                      : "bg-button-primary text-black active:scale-90"
                  }`}
                  onClick={betLocked ? undefined : handleMineBet}
                >
                  {getButtonText()}
                </button>
              )}
            </div>
          </>
        )}

        {betMode === "auto" && (
          <>
            <div className="order-1">
              <BetAmount
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                disabled={startAutoBet}
              />
            </div>

            <div className="order-2 flex flex-col gap-3">
              <FieldCard label="Mines">
                <div className="relative">
                  <select
                    className={selectClass}
                    value={mines}
                    id="auto-mines"
                    disabled={startAutoBet}
                    onChange={(e) => setMines(Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                    bombs
                  </span>
                </div>
              </FieldCard>

              <NumberOfBets
                nbets={nbets}
                setNBets={setNBets}
                disabled={startAutoBet}
                id="auto-nbets"
              />
            </div>

            <div className="order-last">
              <button
                type="button"
                disabled={autoStartLocked}
                className={`${primaryButtonClass} ${
                  autoStartLocked
                    ? "cursor-not-allowed bg-primary text-white opacity-60"
                    : "bg-button-primary text-black active:scale-90"
                }`}
                onClick={autoStartLocked ? undefined : handleAutoBet}
              >
                {startAutoBet ? "Autobetting..." : "Start Autobet"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SideBar;
