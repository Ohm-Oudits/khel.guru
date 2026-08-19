import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";
import apiService from "../../config/api";

const CHAIN_META = {
  eth: {
    label: "Ethereum",
    symbol: "ETH",
    networkLabels: { sepolia: "Sepolia testnet", mainnet: "Ethereum mainnet" },
    explorerTx: {
      sepolia: (tx) => `https://sepolia.etherscan.io/tx/${tx}`,
      mainnet: (tx) => `https://etherscan.io/tx/${tx}`,
    },
  },
  sol: {
    label: "Solana",
    symbol: "SOL",
    networkLabels: { devnet: "Solana devnet", mainnet: "Solana mainnet" },
    explorerTx: {
      devnet: (tx) => `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
      mainnet: (tx) => `https://explorer.solana.com/tx/${tx}`,
    },
  },
};

const STATUS_STYLES = {
  pending: "bg-yellow-500/15 text-yellow-300",
  confirmed: "bg-blue-500/15 text-blue-300",
  crediting: "bg-blue-500/15 text-blue-300",
  credited: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-red-500/15 text-red-300",
};

const shortHash = (hash) =>
  hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;

const CryptoDepositPanel = ({ onDepositCredited }) => {
  const [activeChain, setActiveChain] = useState("eth");
  const [addressData, setAddressData] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [simulating, setSimulating] = useState(false);
  const pollRef = useRef(null);

  const loadAddresses = async () => {
    try {
      const response = await apiService.wallet.getCryptoAddresses();
      setAddressData(response.data);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error.response?.data?.error || "Crypto deposit addresses unavailable."
      );
    }
  };

  const loadDeposits = async () => {
    try {
      const response = await apiService.wallet.getCryptoDeposits({ limit: 10 });
      setDeposits(response.data?.deposits || []);
    } catch {
      // Address panel stays useful even if the deposit list is unavailable.
    }
  };

  useEffect(() => {
    loadAddresses();
    loadDeposits();
    pollRef.current = setInterval(loadDeposits, 15000);

    return () => clearInterval(pollRef.current);
  }, []);

  const activeAddress = addressData?.addresses?.find(
    (entry) => entry.chain === activeChain
  );
  const meta = CHAIN_META[activeChain];

  const copyAddress = async () => {
    if (!activeAddress) return;
    try {
      await navigator.clipboard.writeText(activeAddress.address);
      toast.success("Deposit address copied");
    } catch {
      toast.error("Could not copy address");
    }
  };

  const simulateDeposit = async () => {
    setSimulating(true);
    try {
      await apiService.wallet.simulateCryptoDeposit(
        activeChain,
        activeChain === "eth" ? 0.01 : 0.5
      );
      toast.success("Simulated deposit credited");
      await loadDeposits();
      onDepositCredited?.();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Simulated deposit unavailable"
      );
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
          Crypto Deposit
        </p>
        {addressData?.accountUid ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-text-tertiary">
            Account ID: {addressData.accountUid}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        {Object.entries(CHAIN_META).map(([chain, chainMeta]) => (
          <button
            key={chain}
            type="button"
            onClick={() => setActiveChain(chain)}
            className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
              activeChain === chain
                ? "bg-brand-primary text-text-inverse"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {chainMeta.label}
          </button>
        ))}
      </div>

      {loadError ? (
        <p className="mt-4 text-sm text-text-secondary">{loadError}</p>
      ) : !activeAddress ? (
        <p className="mt-4 text-sm text-text-secondary">Loading address...</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center rounded-2xl bg-white p-3">
            <QRCodeSVG value={activeAddress.address} size={132} />
          </div>
          <div>
            <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300">
              {meta.networkLabels[activeAddress.network] || activeAddress.network}
            </span>
            <p className="mt-3 break-all font-mono text-sm text-white">
              {activeAddress.address}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyAddress}
                className="rounded-2xl bg-brand-primary px-4 py-2 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover"
              >
                Copy Address
              </button>
              {import.meta.env.DEV ? (
                <button
                  type="button"
                  onClick={simulateDeposit}
                  disabled={simulating}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {simulating ? "Simulating..." : "Simulate Deposit"}
                </button>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-text-tertiary">
              Send native {meta.symbol} only. Tokens and contract-initiated
              transfers are not detected. Deposits credit your cash balance
              after confirmation.
            </p>
          </div>
        </div>
      )}

      {deposits.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                <th className="pb-2 pr-4">Chain</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Credited</th>
                <th className="pb-2">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit) => (
                <tr key={deposit.id} className="border-t border-white/5">
                  <td className="py-2 pr-4 font-semibold text-white">
                    {CHAIN_META[deposit.chain]?.symbol || deposit.chain}
                  </td>
                  <td className="py-2 pr-4 text-white">
                    {deposit.amountCrypto}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        STATUS_STYLES[deposit.status] || STATUS_STYLES.pending
                      }`}
                    >
                      {deposit.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-text-secondary">
                    {deposit.creditedAmount !== null &&
                    deposit.creditedAmount !== undefined
                      ? `${deposit.creditedAmount.toFixed(2)} ${
                          deposit.creditedCurrency || "INR"
                        }`
                      : "—"}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    <a
                      href={CHAIN_META[deposit.chain]?.explorerTx?.[
                        deposit.network
                      ]?.(deposit.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-primary hover:underline"
                    >
                      {shortHash(deposit.txHash)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default CryptoDepositPanel;
