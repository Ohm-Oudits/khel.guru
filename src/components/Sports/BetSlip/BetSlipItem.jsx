import { IoClose } from "react-icons/io5";
import useBetSlipStore from "../../../store/betSlipStore";

const BetSlipItem = ({ item, onPlace }) => {
  const removeSelection = useBetSlipStore((state) => state.removeSelection);
  const setStake = useBetSlipStore((state) => state.setStake);
  const acceptNewPrice = useBetSlipStore((state) => state.acceptNewPrice);

  const stakeNumber = Number(item.stake);
  const validStake = Number.isFinite(stakeNumber) && stakeNumber > 0;
  const potentialPayout = validStake
    ? (stakeNumber * item.priceDecimal).toFixed(2)
    : null;

  return (
    <div className="rounded-lg bg-background-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {item.selectionName}
            {item.line !== null ? ` ${item.line}` : ""}
          </p>
          <p className="truncate text-xs text-text-tertiary">
            {item.marketTitle} · {item.eventName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-primary">
            {Number(item.priceDecimal).toFixed(2)}
          </span>
          <IoClose
            onClick={() => removeSelection(item.id)}
            className="cursor-pointer text-lg text-text-tertiary hover:text-white"
          />
        </div>
      </div>

      {item.status === "placed" ? (
        <p className="mt-2 rounded bg-green-500/10 px-2 py-1 text-xs text-green-400">
          Bet placed — track it in My Bets
        </p>
      ) : item.status === "price_changed" ? (
        <div className="mt-2 rounded bg-yellow-500/10 p-2 text-xs">
          <p className="text-yellow-300">
            Odds changed: {Number(item.priceDecimal).toFixed(2)} →{" "}
            {Number(item.newPrice).toFixed(2)}
          </p>
          <button
            type="button"
            onClick={() => acceptNewPrice(item.id)}
            className="mt-2 rounded bg-yellow-500/20 px-3 py-1 font-semibold text-yellow-200 hover:bg-yellow-500/30"
          >
            Accept new odds
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Stake (INR)"
              value={item.stake}
              onChange={(e) => setStake(item.id, e.target.value)}
              className="w-full rounded-md bg-background-secondary px-3 py-2 text-sm text-white outline-none"
            />
            <button
              type="button"
              disabled={!validStake || item.status === "placing"}
              onClick={() => onPlace(item)}
              className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                validStake && item.status !== "placing"
                  ? "bg-brand-primary text-text-inverse hover:bg-interactive-primaryHover"
                  : "cursor-not-allowed bg-background-secondary text-text-muted"
              }`}
            >
              {item.status === "placing" ? "Placing…" : "Place bet"}
            </button>
          </div>
          {potentialPayout && (
            <p className="mt-1 text-xs text-text-tertiary">
              Potential payout: ₹{potentialPayout}
            </p>
          )}
          {item.status === "error" && item.error && (
            <p className="mt-1 text-xs text-red-400">{item.error}</p>
          )}
        </>
      )}
    </div>
  );
};

export default BetSlipItem;
