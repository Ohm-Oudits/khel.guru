import { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { TransactionType } from "./LeftSection";
import apiService from "../../config/api";

const statusIcon = (status) => {
  if (status === "success") return <FaCheckCircle className="text-green-400" />;
  if (status === "pending") return <FaInfoCircle className="text-yellow-400" />;
  return <FaExclamationCircle className="text-red-400" />;
};

const statusLabel = {
  success: "Paid",
  pending: "Under Review",
  failed: "Failed",
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

const Withdrawls = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await apiService.wallet.getTransactions();
        if (cancelled) return;
        const transactions = response.data?.transactions || [];
        setWithdrawals(transactions.filter((txn) => txn.type === "withdraw"));
      } catch {
        if (!cancelled) setError("Could not load withdrawals.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="m p-6 max-w-[1200px] flex justify-between mx-auto text-white">
      <TransactionType type={"Withdrawals"} />
      <section className="max-w-[900px] w-full mx-auto bg-gray-900 p-4 py-6 rounded-md">
        <h2 className="px-2 text-lg font-bold">Withdrawals</h2>
        <div className=" rounded-lg mt-4">
          {loading ? (
            <p className="p-3 text-gray-400">Loading withdrawals...</p>
          ) : error ? (
            <p className="p-3 text-gray-400">{error}</p>
          ) : withdrawals.length === 0 ? (
            <p className="p-3 text-gray-400">No withdrawals yet.</p>
          ) : (
            withdrawals.map((txn, index) => (
              <div
                key={txn._id || index}
                className={`flex justify-between items-center ${
                  index % 2 == 0 ? "bg-gray-800" : ""
                }  p-3 rounded-lg mb-2 `}
              >
                <div className="flex items-center space-x-2">
                  {statusIcon(txn.status)}
                  <div>
                    <p className="text-white">
                      {statusLabel[txn.status] || txn.status}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {formatDate(txn.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <span className="uppercase text-xs text-gray-500">
                    {txn.meta?.reason || txn.meta?.method || "cash"}
                  </span>
                  <span>{Number(txn.amount).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

export default Withdrawls;
