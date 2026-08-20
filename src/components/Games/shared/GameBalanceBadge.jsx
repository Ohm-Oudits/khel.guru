import { useState } from "react";
import { toast } from "react-toastify";
import { useGameBalance } from "../../../hooks/useGameBalance";
import apiService from "../../../config/api";
import { requestWalletRefresh } from "../../../utils/walletEvents";

// Compact demo-balance readout for casino game bet panels. Updates live off
// wallet-refresh broadcasts so a bet's debit/credit is visible immediately.
// Demo play needs funds, so a one-tap top-up lives right here — no hunting
// through Settings.
const GameBalanceBadge = ({ walletType = "demo", topUpAmount = 1000, className = "" }) => {
  const { balance, loading } = useGameBalance(walletType);
  const [adding, setAdding] = useState(false);

  const addFunds = async () => {
    setAdding(true);
    try {
      await apiService.wallet.topUpDemo(topUpAmount, "game");
      requestWalletRefresh();
      toast.success(`Added ₹${topUpAmount} demo funds`);
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Could not add demo funds"
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2 text-xs ${className}`}
    >
      <div className="flex flex-col">
        <span className="uppercase tracking-wide text-gray-400">
          {walletType === "cash" ? "Cash Balance" : "Demo Balance"}
        </span>
        <span className="font-semibold text-white">
          {loading || balance === null ? "—" : `₹${Number(balance).toFixed(2)}`}
        </span>
      </div>
      {walletType === "demo" ? (
        <button
          type="button"
          onClick={addFunds}
          disabled={adding}
          className="shrink-0 rounded-md bg-button-primary px-2.5 py-1 text-[11px] font-semibold text-black transition-transform active:scale-95 disabled:opacity-60"
        >
          {adding ? "Adding…" : `+ ₹${topUpAmount}`}
        </button>
      ) : null}
    </div>
  );
};

export default GameBalanceBadge;
