const NumberOfBets = ({
  nbets,
  setNBets,
  disabled = false,
  min = 1,
  max,
  id = "numberOfBets",
  hint,
}) => {
  const numericValue = Number(nbets);
  const isZeroLike =
    nbets === "" ||
    nbets == null ||
    (Number.isFinite(numericValue) && numericValue === 0);
  const inputValue = isZeroLike ? "" : nbets;

  return (
    <div className="my-2 w-full">
      <div className="mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label">
        Number of Bets
      </div>
      <div className="mt-1 rounded-[1.15rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(20,241,149,0.09),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,215,0,0.08),_transparent_26%),linear-gradient(180deg,_rgba(20,25,23,0.96),_rgba(12,16,14,0.98))] p-1 shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
        <div className="relative">
          <input
            type="number"
            id={id}
            min={min}
            max={max}
            value={inputValue}
            disabled={disabled}
            onChange={(e) => !disabled && setNBets(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            className={`h-10 w-full rounded-[0.95rem] border border-white/10 bg-background-tertiary/95 px-3 pr-14 text-[1.02rem] font-semibold tracking-[0.01em] text-white outline-none transition placeholder:text-text-tertiary focus:border-brand-primary/40 focus:bg-background-surface ${
              disabled ? "cursor-not-allowed opacity-50" : ""
            }`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
            bets
          </span>
        </div>
      </div>
      {hint ? (
        <div className="mt-1 pl-[2px] text-sm text-text-tertiary">{hint}</div>
      ) : null}
    </div>
  );
};

export default NumberOfBets;
