import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import PlatformStateCard from "../../components/platform/PlatformStateCard";
import apiService from "../../config/api";
import { walletActionCards } from "../../config/platformNavigation";

const WalletHub = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const [walletOverview, setWalletOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setWalletOverview(null);
      return;
    }

    setLoading(true);
    apiService.wallet
      .getAccounts()
      .then((response) => {
        setWalletOverview(response.data);
      })
      .catch(() => {
        setWalletOverview(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const openTab = (tab) => {
    navigate({ pathname: "/wallet", search: `?tab=${tab}` });
  };

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
