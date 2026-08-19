import { useGameBalance } from "../../../hooks/useGameBalance";

// Compact demo-balance readout for casino game bet panels. Updates live off
// wallet-refresh broadcasts so a bet's debit/credit is visible immediately.
const GameBalanceBadge = ({ walletType = "demo", className = "" }) => {
  const { balance, loading } = useGameBalance(walletType);

  return (
    <div
      className={`flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-xs ${className}`}
    >
      <span className="uppercase tracking-wide text-gray-400">
        {walletType === "cash" ? "Cash Balance" : "Demo Balance"}
      </span>
      <span className="font-semibold text-white">
        {loading || balance === null ? "—" : `₹${Number(balance).toFixed(2)}`}
      </span>
    </div>
  );
};

export default GameBalanceBadge;
