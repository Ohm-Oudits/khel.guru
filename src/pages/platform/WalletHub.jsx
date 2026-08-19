import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiService from "../../config/api";
import { walletActionCards } from "../../config/platformNavigation";

const WalletHub = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }

    setLoading(true);
    apiService.wallet
      .getBalance()
      .then((response) => {
        setBalance(response.data.balance);
      })
      .catch(() => {
        setBalance(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const openTab = (tab) => {
    navigate({ pathname: "/wallet", search: `?tab=${tab}` });
  };

  return (
    <div className="px-4 pb-24 pt-6 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-emerald-400/20 bg-[linear-gradient(135deg,_rgba(8,30,27,1)_0%,_rgba(11,11,11,1)_65%,_rgba(23,15,8,1)_100%)] p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Wallet & Vault
          </p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Cashier visibility now lives at the top level.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-text-secondary">
            Stake makes wallet, vault, payment info, and history easy to find.
            This shell now gives Khel Guru the same product-level visibility
            before the deeper ledger and payment phases land.
          </p>
        </section>

        {!user ? (
          <section className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
            <h2 className="text-2xl font-black text-white">
              Sign in to use wallet actions
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Cashier, vault, and transaction flows already have entry points in
              the app, but they should only activate once a player is signed in.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
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
            </div>
          </section>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
                Account Balance
              </p>
              <div className="mt-3 flex items-end gap-3">
                <h2 className="text-4xl font-black text-white">
                  {loading
                    ? "Loading..."
                    : balance !== null
                    ? balance.toFixed(2)
                    : "Unavailable"}
                </h2>
                <span className="pb-2 text-sm font-semibold text-text-tertiary">
                  wallet units
                </span>
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                This is still backed by the current wallet service. Later phases
                will swap it onto the ledger-first cashier model.
              </p>
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
            </div>

            <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
                Quick Actions
              </p>
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
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default WalletHub;
