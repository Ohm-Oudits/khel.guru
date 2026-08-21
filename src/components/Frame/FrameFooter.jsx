const footerModeShellClass =
  "flex items-center gap-[0.16rem] rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(17,23,20,0.96),rgba(11,16,14,0.98))] p-[0.18rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

const getFooterModeButtonClass = ({
  active,
  disabled,
  unsupported = false,
}) => {
  const stateClass = active
    ? "border-brand-primary/35 bg-brand-primary text-[#04110d] shadow-[0_8px_18px_rgba(0,212,170,0.16)]"
    : "border-transparent bg-transparent text-[rgba(233,238,229,0.7)]";

  const interactionClass =
    disabled || unsupported
      ? "cursor-default opacity-55"
      : "cursor-pointer hover:text-white hover:bg-white/5 active:scale-[0.98]";

  return `inline-flex min-w-[3.3rem] items-center justify-center rounded-full border px-2.5 py-[0.3125rem] text-[0.58rem] font-semibold uppercase tracking-[0.17em] transition-all duration-200 ${stateClass} ${interactionClass}`;
};

const FrameFooter = ({
  setIsFairness,
  theatreMode,
  setTheatreMode,
  betMode = "manual",
  onBetModeChange,
  modeSwitchDisabled = false,
}) => {
  const resolvedMode = betMode === "auto" ? "auto" : "manual";
  const hasInteractiveModeSwitch = typeof onBetModeChange === "function";
  const footerModeDisabled = modeSwitchDisabled || !hasInteractiveModeSwitch;

  const handleModeChange = (nextMode) => {
    if (footerModeDisabled) return;
    onBetModeChange(nextMode);
  };

  return (
    <div className="relative flex items-center justify-between gap-3 rounded-b bg-inactive px-4 py-2 max-md:flex-wrap">
      <div className="flex min-w-0 items-center gap-3">
        <div className={footerModeShellClass} aria-label="Bet mode switch">
          <button
            type="button"
            onClick={() => handleModeChange("manual")}
            className={getFooterModeButtonClass({
              active: resolvedMode === "manual",
              disabled: modeSwitchDisabled,
            })}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("auto")}
            className={getFooterModeButtonClass({
              active: resolvedMode === "auto",
              disabled: footerModeDisabled,
              unsupported: !hasInteractiveModeSwitch,
            })}
          >
            Auto
          </button>
        </div>

        <button
          type="button"
          className={`relative hidden items-center justify-center text-gray-300 transition hover:text-white max-lg:hidden ${
            theatreMode ? "text-white" : "text-gray-300"
          }`}
          onClick={() => setTheatreMode?.(!theatreMode)}
        >
          <svg fill="currentColor" viewBox="0 0 64 64" className="svg-icon">
            <path d="M64 58.5H0v-53h64v53Zm-56-8h48v-37H8v37Z"></path>
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setIsFairness?.(true)}
        className="text-[12px] font-semibold text-gray-300 transition hover:text-white md:text-base"
      >
        Fairness
      </button>
    </div>
  );
};

export default FrameFooter;
