import { useEffect, useRef, useState } from "react";

const normalizeAmount = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";

  const fixed = numericValue.toFixed(6);
  return fixed.replace(/\.?0+$/, "") || "0";
};

const BetAmount = ({
  bet,
  setBet,
  maxBetEnable,
  disabled,
  maxValue = "1000",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState(null);
  const quickActionResetRef = useRef(null);
  const quickActionClass =
    "inline-flex h-10 min-w-[3.35rem] items-center justify-center rounded-[0.95rem] px-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50";
  const accentQuickActionClass =
    "border-brand-primary/35 bg-brand-primary text-[#04110d] shadow-[0_12px_28px_rgba(0,212,170,0.18)] hover:bg-interactive-primaryHover hover:shadow-[0_14px_32px_rgba(0,212,170,0.24)]";
  const numericBet = Number(bet);
  const isZeroLike =
    bet === "" || (Number.isFinite(numericBet) && numericBet === 0);
  const inputValue = !isFocused && isZeroLike ? "" : bet;

  useEffect(
    () => () => {
      if (quickActionResetRef.current) {
        clearTimeout(quickActionResetRef.current);
      }
    },
    []
  );

  const triggerQuickAction = (actionKey, nextValue) => {
    if (disabled) return;

    setBet(nextValue);
    setActiveQuickAction(actionKey);

    if (quickActionResetRef.current) {
      clearTimeout(quickActionResetRef.current);
    }

    quickActionResetRef.current = setTimeout(() => {
      setActiveQuickAction(null);
      quickActionResetRef.current = null;
    }, 280);
  };

  return (
    <div className="my-2 w-full">
      <div className="mb-1.5 pl-[2px] text-[11px] font-semibold uppercase tracking-wide text-label">
        Bet Amount
      </div>
      <div className="mt-1 rounded-[1.15rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(20,241,149,0.09),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,215,0,0.08),_transparent_26%),linear-gradient(180deg,_rgba(20,25,23,0.96),_rgba(12,16,14,0.98))] p-1 shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
        <div className="flex items-center gap-1">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-tertiary">
              $
            </span>
            <input
              type="text"
              value={inputValue}
              id="betAmount"
              onChange={(e) => !disabled && setBet(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (isZeroLike && !disabled) {
                  setBet("");
                }
              }}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              inputMode="decimal"
              className={`h-10 w-full rounded-[0.95rem] border border-white/10 bg-background-tertiary/95 pl-7 pr-12 text-[1.02rem] font-semibold tracking-[0.01em] text-white outline-none transition placeholder:text-text-tertiary focus:border-brand-primary/40 focus:bg-background-surface ${
                disabled ? "cursor-not-allowed opacity-50" : ""
              }`}
              placeholder="0.00"
            />
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              triggerQuickAction("half", normalizeAmount(Number(bet) / 2))
            }
            className={`${quickActionClass} ${accentQuickActionClass} ${
              activeQuickAction === "half" ? "bet-amount-quick-action-bounce" : ""
            }`}
          >
            1/2
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              triggerQuickAction("double", normalizeAmount(Number(bet) * 2))
            }
            className={`${quickActionClass} ${accentQuickActionClass} ${
              activeQuickAction === "double"
                ? "bet-amount-quick-action-bounce"
                : ""
            }`}
          >
            2x
          </button>
          {maxBetEnable && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => triggerQuickAction("max", maxValue)}
              className={`${quickActionClass} ${accentQuickActionClass} ${
                activeQuickAction === "max"
                  ? "bet-amount-quick-action-bounce"
                  : ""
              }`}
            >
              Max
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BetAmount;
