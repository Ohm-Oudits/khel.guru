import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { TransactionType } from "./LeftSection";
import apiService from "../../config/api";

const CATEGORY_LABELS = {
  deposit: "Deposit",
  demo_topup: "Demo Top-up",
  withdrawal: "Withdrawal",
  vault_transfer: "Vault Transfer",
  sports_bet: "Sports Bet",
  sports_settlement: "Sports Settlement",
  sports_refund: "Sports Refund",
  adjustment: "Adjustment",
  bonus: "Bonus",
  manual_review: "Manual Review",
};

const formatDate = (value) =>
  new Date(value).toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

const Others = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await apiService.wallet.getLedger();
        if (cancelled) return;
        setEntries(response.data?.ledgerEntries || []);
      } catch {
        if (!cancelled) setError("Could not load ledger activity.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(entries.map((entry) => entry.category))),
  ];

  const visible =
    selectedType === "All"
      ? entries
      : entries.filter((entry) => entry.category === selectedType);

  return (
    <main className="m p-6 max-w-[1200px] flex justify-between mx-auto text-white">
      <TransactionType type={"Other"} />
      <section className="max-w-[900px] w-full mx-auto bg-gray-900 p-4 py-6 rounded-md">
        <div className="flex space-x-4 bg-gray-800 p-2 w-full max-w-[90vw] overflow-x-auto rounded-full scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold ${
                selectedType === category
                  ? "bg-gray-700 text-white"
                  : "text-white"
              }`}
              onClick={() => setSelectedType(category)}
            >
              {CATEGORY_LABELS[category] || category}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-400">Loading ledger…</p>
        ) : error ? (
          <p className="py-10 text-center text-gray-400">{error}</p>
        ) : !visible.length ? (
          <p className="py-10 text-center text-gray-400">
            No ledger activity yet.
          </p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="h-10 text-gray-400">
                <th>Type</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
                <th className="text-right pr-2">Balance After</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry._id} className="h-12 border-t border-gray-800">
                  <td className="flex h-12 items-center gap-2">
                    {entry.direction === "credit" ||
                    entry.direction === "release" ? (
                      <FaArrowDown className="text-green-400" />
                    ) : (
                      <FaArrowUp className="text-red-400" />
                    )}
                    {CATEGORY_LABELS[entry.category] || entry.category}
                  </td>
                  <td className="text-gray-400">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td
                    className={`text-right ${
                      entry.direction === "credit" ||
                      entry.direction === "release"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {entry.direction === "credit" ||
                    entry.direction === "release"
                      ? "+"
                      : "-"}
                    ₹{Number(entry.amount).toFixed(2)}
                  </td>
                  <td className="text-right pr-2">
                    {entry.balanceAfter !== undefined &&
                    entry.balanceAfter !== null
                      ? `₹${Number(entry.balanceAfter).toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
};

export default Others;
