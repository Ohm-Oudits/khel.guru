import { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaLock, FaWallet } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../config/api";
import { requestWalletRefresh } from "../../utils/walletEvents";

const Vault = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("to-vault");
  const [amount, setAmount] = useState("");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    navigate(window.location.pathname, { replace: true });
  };

  const loadOverview = async () => {
    try {
      const res = await apiService.wallet.getAccounts();
      setOverview(res.data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      await apiService.wallet.vaultTransfer(value, mode);
      setAmount("");
      setMessage(
        mode === "to-vault"
          ? "Funds moved into the vault."
          : "Funds moved back to your wallet."
      );
      await loadOverview();
      requestWalletRefresh();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Transfer failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cashBalance = overview?.cashBalance ?? 0;
  const vaultBalance = overview?.vaultBalance ?? 0;

  return (
    <div
      className="bg-[rgba(0,0,0,0.7)] cursor-pointer backdrop-blur-sm w-full h-screen fixed top-0 left-0 z-[99] overflow-y-auto flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-primary cursor-default text-white rounded flex-col w-[90%] max-w-[440px] px-5 py-6 animate-fadeUp relative"
      >
        <div
          onClick={handleClose}
          className="absolute cursor-pointer top-5 right-5"
        >
          <IoMdClose size={20} />
        </div>

        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <FaLock className="text-[#4391E7]" /> Vault
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Keep funds aside — vault balance is excluded from betting.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-primary-1 p-3">
            <p className="flex items-center gap-2 text-xs text-zinc-400">
              <FaWallet /> Wallet (cash)
            </p>
            <p className="mt-1 text-lg font-bold">
              {loading ? "…" : `₹${Number(cashBalance).toFixed(2)}`}
            </p>
          </div>
          <div className="rounded-lg bg-primary-1 p-3">
            <p className="flex items-center gap-2 text-xs text-zinc-400">
              <FaLock /> Vault
            </p>
            <p className="mt-1 text-lg font-bold">
              {loading ? "…" : `₹${Number(vaultBalance).toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="mt-4 flex rounded-full bg-primary-1 p-1 text-sm">
          <button
            type="button"
            className={`flex-1 rounded-full py-2 font-semibold transition-colors ${
              mode === "to-vault" ? "bg-ter text-white" : "text-zinc-400"
            }`}
            onClick={() => setMode("to-vault")}
          >
            Deposit to Vault
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full py-2 font-semibold transition-colors ${
              mode === "from-vault" ? "bg-ter text-white" : "text-zinc-400"
            }`}
            onClick={() => setMode("from-vault")}
          >
            Withdraw to Wallet
          </button>
        </div>

        <form onSubmit={handleTransfer} className="mt-4 flex flex-col gap-3">
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="Amount (INR)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md bg-primary-1 px-4 py-3 text-white outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}
          <button
            type="submit"
            disabled={submitting || !amount}
            className="w-full rounded-md bg-ter py-3 font-semibold transition active:scale-[0.98] disabled:opacity-50"
          >
            {submitting
              ? "Transferring…"
              : mode === "to-vault"
              ? "Deposit to Vault"
              : "Withdraw to Wallet"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Vault;
