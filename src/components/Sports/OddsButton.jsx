import { useEffect, useRef, useState } from "react";
import useBetSlipStore from "../../store/betSlipStore";

const OddsButton = ({
  event,
  market,
  selection,
  compact = false,
  stacked = false,
}) => {
  const addSelection = useBetSlipStore((state) => state.addSelection);
  const selected = useBetSlipStore((state) =>
    state.items.some(
      (item) => item.id === `${market._id}:${selection.key}`
    )
  );

  const price = selection.priceDecimal;
  const previousPrice = useRef(price);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (previousPrice.current !== null && price !== previousPrice.current) {
      setFlash(price > previousPrice.current ? "up" : "down");
      const timer = setTimeout(() => setFlash(null), 1000);
      previousPrice.current = price;
      return () => clearTimeout(timer);
    }
    previousPrice.current = price;
  }, [price]);

  const disabled =
    market.status !== "open" ||
    selection.status !== "open" ||
    price === null ||
    price === undefined;

  const eventName = (event.competitors || [])
    .map((competitor) => competitor.name)
    .join(" vs ");

  const handleClick = () => {
    if (disabled) return;
    addSelection({
      eventId: event._id,
      marketId: market._id,
      selectionKey: selection.key,
      selectionName: selection.name,
      line: selection.line,
      priceDecimal: price,
      eventName,
      marketTitle: market.title,
    });
  };

  const priceLabel =
    disabled && (price === null || price === undefined)
      ? "—"
      : Number(price).toFixed(2);

  if (stacked) {
    return (
      <button
        type="button"
        onClick={(clickEvent) => {
          clickEvent.stopPropagation();
          handleClick();
        }}
        disabled={disabled}
        className={`flex min-h-[3.25rem] w-full flex-col items-center justify-center rounded-lg px-1.5 py-1.5 text-center ${
          selected
            ? "bg-brand-primary text-text-inverse"
            : "bg-background-surface text-text-secondary hover:bg-background-elevated"
        } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${
          flash === "up" ? "ring-1 ring-brand-primary" : ""
        } ${flash === "down" ? "ring-1 ring-red-500" : ""}`}
      >
        <span
          className={`w-full truncate text-[11px] leading-tight ${
            selected ? "text-text-inverse" : "text-text-secondary"
          }`}
        >
          {selection.name}
        </span>
        <span
          className={`mt-0.5 text-sm font-semibold tabular-nums ${
            selected ? "text-text-inverse" : "text-brand-primary"
          }`}
        >
          {priceLabel}
        </span>
      </button>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`min-w-[3.5rem] rounded-lg px-2.5 py-1.5 text-sm font-semibold tabular-nums ${
          selected
            ? "bg-brand-primary text-text-inverse"
            : "bg-background-surface text-brand-primary hover:bg-background-elevated"
        } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${
          flash === "up" ? "ring-1 ring-brand-primary" : ""
        } ${flash === "down" ? "ring-1 ring-red-500" : ""}`}
      >
        {priceLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex min-w-[90px] flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        selected
          ? "bg-brand-primary text-text-inverse"
          : "bg-background-surface text-text-secondary hover:bg-background-elevated"
      } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${
        flash === "up" ? "ring-1 ring-brand-primary" : ""
      } ${flash === "down" ? "ring-1 ring-red-500" : ""}`}
    >
      <span className="truncate text-left text-text-tertiary">
        {selection.name}
        {selection.line !== null && selection.line !== undefined
          ? ` ${selection.line}`
          : ""}
      </span>
      <span
        className={`font-semibold ${
          selected ? "text-text-inverse" : "text-brand-primary"
        }`}
      >
        {priceLabel}
      </span>
    </button>
  );
};

export default OddsButton;
