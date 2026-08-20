import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import PlatformStateCard from "../../components/platform/PlatformStateCard";
import CryptoDepositPanel from "../../components/platform/CryptoDepositPanel";
import apiService from "../../config/api";
import { getSocket } from "../../socket/socket";
import { walletActionCards } from "../../config/platformNavigation";
import {
  onWalletRefresh,
  requestWalletRefresh,
} from "../../utils/walletEvents";

const CASHIER_TABS = [
  { key: "upi", label: "Deposit · UPI" },
  { key: "crypto", label: "Deposit · Crypto" },
  { key: "withdraw", label: "Withdraw" },
];

const INTENT_POLL_MS = 2000;
const INTENT_POLL_MAX_MS = 60000;

const formatCountdown = (expiresAt) => {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return "expired";
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const WalletHub = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const [walletOverview, setWalletOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1000");
  const [depositMethod, setDepositMethod] = useState("upi");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [cashierMessage, setCashierMessage] = useState("");
  const [activeIntent, setActiveIntent] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [payerVpa, setPayerVpa] = useState("");
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [cashierTab, setCashierTab] = useState("upi");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutVpa, setPayoutVpa] = useState("");
  const [payoutMessage, setPayoutMessage] = useState("");
  const [payoutError, setPayoutError] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const pollStartedAtRef = useRef(null);

  const [addingDemo, setAddingDemo] = useState(false);

  const loadWalletOverview = async () => {
    if (!user) {
      setWalletOverview(null);
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.wallet.getAccounts();
      setWalletOverview(response.data);
    } catch {
      setWalletOverview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDemoFunds = async () => {
    setAddingDemo(true);
    try {
      await apiService.wallet.topUpDemo(5000, "wallet");
      await loadWalletOverview();
      requestWalletRefresh();
    } finally {
      setAddingDemo(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setWalletOverview(null);
      return undefined;
    }

    loadWalletOverview();
    // Bets, settlements, and other surfaces broadcast refresh requests.
    return onWalletRefresh(loadWalletOverview);
  }, [user]);

  const openTab = (tab) => {
    navigate({ pathname: "/wallet", search: `?tab=${tab}` });
  };

  const applyIntentUpdate = (intent, balance) => {
    setActiveIntent(intent);

    if (intent.status === "succeeded") {
      setCashierMessage(
        `Deposit of ${Number(intent.amount).toFixed(2)} credited successfully.`
      );
      loadWalletOverview();
      requestWalletRefresh();
    } else if (intent.status === "failed") {
      setCashierMessage(
        intent.failureReason === "amount_mismatch"
          ? "Deposit failed: amount mismatch reported by provider."
          : "Deposit failed. You can retry with a new deposit."
      );
    } else if (intent.status === "expired") {
      setCashierMessage("Deposit intent expired before payment. Start a new one.");
    }

    if (balance !== undefined && balance !== null) {
      setWalletOverview((current) =>
        current ? { ...current, cashBalance: balance } : current
      );
    }
  };

  const handleCashDeposit = async (event) => {
    event.preventDefault();
    setSubmittingDeposit(true);
    setCashierMessage("");
    setActiveIntent(null);
    setCheckout(null);
    setPayerVpa("");

    try {
      const response = await apiService.cashier.createDepositIntent({
        amount: depositAmount,
        method: depositMethod,
      });
      setActiveIntent(response.data.intent);
      setCheckout(response.data.checkout);
      pollStartedAtRef.current = Date.now();
    } catch (error) {
      setCashierMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Could not start the deposit."
      );
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!activeIntent) return;
    setConfirmingPayment(true);

    try {
      const response = await apiService.cashier.simulateDepositIntent(
        activeIntent.id,
        { payerVpa }
      );
      applyIntentUpdate(response.data.intent, response.data.balance);
    } catch (error) {
      setCashierMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Payment confirmation failed."
      );
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handlePayoutRequest = async (event) => {
    event.preventDefault();
    setPayoutError("");
    setPayoutMessage("");
    setSubmittingPayout(true);

    try {
      await apiService.cashier.createPayoutRequest({
        amount: Number(payoutAmount),
        method: "upi",
        destination: { vpa: payoutVpa },
      });
      setPayoutAmount("");
      setPayoutMessage(
        "Payout requested — funds are held while the team reviews it."
      );
      loadWalletOverview();
      requestWalletRefresh();
    } catch (error) {
      setPayoutError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Payout request failed."
      );
    } finally {
      setSubmittingPayout(false);
    }
  };

  const intentPending = activeIntent?.status === "processing";

  // Poll the intent while a payment is pending; the socket push below is a
  // faster path but polling is the reliable one.
  useEffect(() => {
    if (!intentPending) return undefined;

    const interval = setInterval(async () => {
      if (Date.now() - (pollStartedAtRef.current || 0) > INTENT_POLL_MAX_MS) {
        clearInterval(interval);
        return;
      }

      try {
        const response = await apiService.cashier.getDepositIntent(
          activeIntent.id
        );
        if (response.data.intent.status !== "processing") {
          applyIntentUpdate(response.data.intent);
        }
      } catch {
        // transient poll failures are fine; next tick retries
      }
    }, INTENT_POLL_MS);

    return () => clearInterval(interval);
  }, [intentPending, activeIntent?.id]);

  useEffect(() => {
    if (!intentPending) return undefined;

    const tick = setInterval(
      () => setCountdown(formatCountdown(activeIntent.expiresAt)),
      1000
    );
    setCountdown(formatCountdown(activeIntent.expiresAt));

    return () => clearInterval(tick);
  }, [intentPending, activeIntent?.expiresAt]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onDepositIntent = (payload) => {
      if (!payload?.intentId) return;
      setActiveIntent((current) => {
        if (!current || current.id !== payload.intentId) return current;
        return { ...current, status: payload.status };
      });
      if (payload.status === "succeeded") {
        loadWalletOverview();
      }
    };

    socket.on("wallet:deposit_intent", onDepositIntent);
    return () => socket.off("wallet:deposit_intent", onDepositIntent);
  }, [user]);

  return (
    <PlatformPage>
      <PlatformHero
        eyebrow="Wallet & Vault"
        title="Cashier visibility now lives at the top level."
        description="Stake makes wallet, vault, payment info, and history easy to find. This shell now gives Khel Guru the same product-level visibility before the deeper ledger and payment phases land."
        tone="wallet"
      />

      {!user ? (
        <PlatformStateCard
          title="Sign in to use wallet actions"
          description="Cashier, vault, and transaction flows already have entry points in the app, but they should only activate once a player is signed in."
          actions={
            <>
              <button
                className="rounded-2xl bg-brand-primary px-5 py-3 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover"
                onClick={() => navigate("/wallet?tab=login")}
              >
                Open Login
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                onClick={() => navigate("/wallet?tab=register")}
              >
                Open Register
              </button>
            </>
          }
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <PlatformPanel>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Wallet Overview
            </p>
            <div className="mt-3 flex items-end gap-3">
              <h2 className="text-4xl font-black text-white">
                {loading
                  ? "Loading..."
                  : walletOverview?.cashBalance !== undefined
                  ? walletOverview.cashBalance.toFixed(2)
                  : "Unavailable"}
              </h2>
              <span className="pb-2 text-sm font-semibold text-text-tertiary">
                {walletOverview?.currency || "INR"}
              </span>
            </div>
            {user?.accountUid ? (
              <p className="mt-2 text-xs text-text-tertiary">
                Account ID:{" "}
                <span className="font-mono text-text-secondary">
                  {user.accountUid}
                </span>
              </p>
            ) : null}
            <p className="mt-3 text-sm text-text-secondary">
              Cash, vault, and demo balances now resolve from the wallet account
              overview instead of an old single-balance endpoint.
            </p>
            {walletOverview ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  {
                    title: "Cash",
                    value: walletOverview.cashBalance,
                  },
                  {
                    title: "Vault",
                    value: walletOverview.vaultBalance,
                  },
                  {
                    title: "Demo",
                    value: walletOverview.demoBalance,
                  },
                ].map((entry) => (
                  <div
                    key={entry.title}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                      {entry.title}
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {Number(entry.value || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-2xl bg-button-primary px-5 py-3 text-sm font-bold text-black transition active:scale-95 disabled:opacity-60"
                onClick={handleAddDemoFunds}
                disabled={addingDemo}
              >
                {addingDemo ? "Adding…" : "Add ₹5,000 Demo Funds"}
              </button>
              <button
                className="rounded-2xl bg-brand-primary px-5 py-3 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover"
                onClick={() => openTab("wallet")}
              >
                Open Cashier
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                onClick={() => openTab("vault")}
              >
                Open Vault
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                onClick={() => navigate("/transactions/deposits")}
              >
                Transaction History
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {CASHIER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCashierTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    cashierTab === tab.key
                      ? "bg-brand-primary text-text-inverse"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {cashierTab === "upi" ? (
            <>
            <form
              className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_180px_auto]"
              onSubmit={handleCashDeposit}
            >
              <label className="text-sm text-text-secondary">
                Real-money deposit amount
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-brand-primary/40"
                />
              </label>
              <label className="text-sm text-text-secondary">
                Deposit method
                <select
                  value={depositMethod}
                  onChange={(event) => setDepositMethod(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-brand-primary/40"
                >
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submittingDeposit}
                  className="w-full rounded-2xl bg-brand-primary px-5 py-3 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submittingDeposit ? "Starting..." : "Deposit Cash"}
                </button>
              </div>
            </form>
            {intentPending && checkout ? (
              <div className="mt-4 rounded-2xl border border-brand-primary/30 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">
                    UPI payment pending — {Number(activeIntent.amount).toFixed(2)}{" "}
                    {activeIntent.currency}
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-text-tertiary">
                    Expires in {countdown}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-tertiary">
                  Pay to <span className="font-mono text-white">{checkout.payeeVpa}</span>
                </p>
                <button
                  type="button"
                  className="mt-2 max-w-full truncate rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-left font-mono text-xs text-text-secondary transition hover:border-brand-primary/40"
                  onClick={() => navigator.clipboard.writeText(checkout.intentUrl)}
                  title="Copy UPI intent link"
                >
                  {checkout.intentUrl}
                </button>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <label className="text-sm text-text-secondary">
                    Your UPI ID
                    <input
                      type="text"
                      value={payerVpa}
                      onChange={(event) => setPayerVpa(event.target.value)}
                      placeholder="yourname@bank"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-brand-primary/40"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={confirmingPayment}
                      onClick={handleConfirmPayment}
                      className="w-full rounded-2xl bg-brand-primary px-5 py-3 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {confirmingPayment ? "Confirming..." : "I have paid"}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[checkout.successVpa, checkout.failureVpa]
                    .filter(Boolean)
                    .map((vpa) => (
                      <button
                        key={vpa}
                        type="button"
                        onClick={() => setPayerVpa(vpa)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-text-tertiary transition hover:border-brand-primary/40"
                      >
                        {vpa}
                      </button>
                    ))}
                  <span className="py-1 text-[11px] text-text-tertiary">
                    sandbox hint VPAs
                  </span>
                </div>
              </div>
            ) : null}
            {cashierMessage ? (
              <p className="mt-3 text-sm text-text-secondary">{cashierMessage}</p>
            ) : null}
            </>
            ) : null}
            {cashierTab === "crypto" ? (
              <CryptoDepositPanel onDepositCredited={loadWalletOverview} />
            ) : null}
            {cashierTab === "withdraw" ? (
              <form
                className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                onSubmit={handlePayoutRequest}
              >
                <p className="text-sm font-bold text-white">
                  Withdraw via UPI payout request
                </p>
                <p className="text-xs text-text-tertiary">
                  Funds are held from your cash balance and released after the
                  review team approves the payout. Verified KYC is required.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-text-secondary">
                    Amount
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={payoutAmount}
                      onChange={(event) => setPayoutAmount(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-brand-primary/40"
                      required
                    />
                  </label>
                  <label className="text-sm text-text-secondary">
                    Your UPI ID
                    <input
                      type="text"
                      value={payoutVpa}
                      onChange={(event) => setPayoutVpa(event.target.value)}
                      placeholder="yourname@bank"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-brand-primary/40"
                      required
                    />
                  </label>
                </div>
                {payoutError ? (
                  <p className="text-sm text-red-400">{payoutError}</p>
                ) : null}
                {payoutMessage ? (
                  <p className="text-sm text-green-400">{payoutMessage}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={submittingPayout}
                    className="rounded-2xl bg-brand-primary px-5 py-3 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submittingPayout ? "Requesting..." : "Request Payout"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/transactions/withdrawals")}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Withdrawal History
                  </button>
                </div>
              </form>
            ) : null}
          </PlatformPanel>

          <PlatformPanel>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Quick Actions
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">
                Total available:{" "}
                {walletOverview?.totals?.available !== undefined
                  ? walletOverview.totals.available.toFixed(2)
                  : "Unavailable"}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                Locked:{" "}
                {walletOverview?.totals?.locked !== undefined
                  ? walletOverview.totals.locked.toFixed(2)
                  : "Unavailable"}
              </p>
              <p className="mt-3 text-xs text-text-tertiary">
                Demo funds are managed from the profile side so sandbox play stays
                separate from live-money deposits.
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              {walletActionCards.map((card) => (
                <button
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-brand-primary/40"
                  onClick={() => openTab(card.tab)}
                >
                  <div className="flex items-center gap-3">
                    <card.icon className="text-xl text-brand-primary" />
                    <div>
                      <p className="font-bold text-white">{card.title}</p>
                      <p className="text-xs text-text-tertiary">
                        {card.action}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </PlatformPanel>
        </section>
      )}
    </PlatformPage>
  );
};

export default WalletHub;
