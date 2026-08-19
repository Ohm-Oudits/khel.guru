import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../config/api";
import LoadingSpinner from "../LoadingSpinner";

const WalletActionsModal = ({ initialBalance, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("deposit");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-background-secondary rounded-xl p-8 w-full max-w-sm shadow-lg relative transform transition-all duration-300 scale-95 animate-scale-in">
        <button
          className="absolute top-4 right-4 text-2xl text-text-tertiary hover:text-text-primary"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-text-tertiary">
            Current Balance
          </h2>
          <p className="text-3xl font-bold text-interactive-primary">
            {initialBalance.toFixed(2)}
          </p>
        </div>

        <div className="flex bg-background-surface rounded-lg p-1 mb-6">
          <button
            className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${
              activeTab === "deposit"
                ? "bg-interactive-primary text-white"
                : "text-text-tertiary hover:bg-background-elevated"
            }`}
            onClick={() => setActiveTab("deposit")}
          >
            Deposit
          </button>
          <button
            className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${
              activeTab === "withdraw"
                ? "bg-interactive-primary text-white"
                : "text-text-tertiary hover:bg-background-elevated"
            }`}
            onClick={() => setActiveTab("withdraw")}
          >
            Withdraw
          </button>
        </div>

        {activeTab === "deposit" && (
          <DepositTab onClose={onClose} />
        )}
        {activeTab === "withdraw" && (
          <WithdrawTab
            currentBalance={initialBalance}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

// Deposits run through the cashier's payment-intent flow (UPI sandbox or
// crypto testnet) — the legacy instant-credit endpoint is dev-gated.
const DepositTab = ({ onClose }) => {
  const navigate = useNavigate();

  const openCashier = () => {
    onClose();
    navigate("/wallet");
  };

  return (
    <div className="flex flex-col gap-4 text-center">
      <p className="text-text-tertiary text-sm">
        Deposits are handled in the cashier — UPI, bank transfer, or crypto,
        with live status tracking.
      </p>
      <button
        type="button"
        onClick={openCashier}
        className="bg-interactive-primary hover:bg-interactive-primaryHover text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105"
      >
        Open Cashier
      </button>
    </div>
  );
};

const WithdrawTab = ({ currentBalance, onSuccess, onClose }) => {
  const [amount, setAmount] = useState("");
  const [vpa, setVpa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (Number(amount) > currentBalance) {
      setError("Withdrawal amount cannot exceed balance.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiService.cashier.createPayoutRequest({
        amount: Number(amount),
        method: "upi",
        destination: { vpa },
      });
      setLoading(false);
      setPendingMessage(
        "Payout requested — funds are held while the team reviews it."
      );
      if (res.data.balance !== undefined) {
        onSuccess(res.data.balance);
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Payout request failed"
      );
    }
  };

  if (pendingMessage) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-text-primary text-sm">{pendingMessage}</p>
        <button
          type="button"
          className="bg-interactive-primary hover:bg-interactive-primaryHover text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
      <input
        type="number"
        min="1"
        className="p-3 rounded-lg bg-background-surface border-2 border-border-primary text-text-primary focus:border-interactive-primary outline-none transition-colors"
        placeholder="Enter withdrawal amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        autoFocus
      />
      <input
        type="text"
        className="p-3 rounded-lg bg-background-surface border-2 border-border-primary text-text-primary focus:border-interactive-primary outline-none transition-colors"
        placeholder="Your UPI ID (yourname@bank)"
        value={vpa}
        onChange={(e) => setVpa(e.target.value)}
        required
      />
      {error && (
        <div className="text-interactive-error text-sm text-center">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="bg-interactive-primary hover:bg-interactive-primaryHover text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50"
        disabled={loading || !amount || !vpa}
      >
        {loading ? (
          <LoadingSpinner size="sm" showText={false} />
        ) : (
          "Request Payout"
        )}
      </button>
      <p className="text-xs text-text-tertiary text-center">
        Payouts are reviewed before funds leave your wallet.
      </p>
    </form>
  );
};

export default WalletActionsModal;
