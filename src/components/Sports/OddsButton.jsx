import { useEffect, useRef, useState } from "react";
import useBetSlipStore from "../../store/betSlipStore";

const OddsButton = ({ event, market, selection }) => {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex flex-1 min-w-[90px] items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
        selected
          ? "bg-[#4391E7] text-white"
          : "bg-primary-1 text-gray-200 hover:bg-activeHover"
      } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${
        flash === "up" ? "ring-2 ring-green-400" : ""
      } ${flash === "down" ? "ring-2 ring-red-400" : ""}`}
    >
      <span className="truncate text-left text-gray-300">
        {selection.name}
        {selection.line !== null && selection.line !== undefined
          ? ` ${selection.line}`
          : ""}
      </span>
      <span
        className={`font-semibold ${
          selected ? "text-white" : "text-[#4391E7]"
        }`}
      >
        {disabled && (price === null || price === undefined)
          ? "—"
          : Number(price).toFixed(2)}
      </span>
    </button>
  );
};

export default OddsButton;
