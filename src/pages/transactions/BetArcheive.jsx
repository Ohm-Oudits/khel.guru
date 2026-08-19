import { useNavigate } from "react-router-dom";
import { TransactionType } from "./LeftSection";

// Full bet history (live statuses, settlement updates) lives in My Bets;
// this tab points there instead of duplicating the table.
const BetArcheive = () => {
  const navigate = useNavigate();

  return (
    <main className="m p-6 max-w-[1200px] flex justify-between mx-auto text-white">
      <TransactionType type={"Bet Archive"} />
      <section className="max-w-[900px] w-full mx-auto bg-gray-900 p-4 py-10 rounded-md text-center">
        <h2 className="text-lg font-semibold">Bet history has moved</h2>
        <p className="mt-2 text-sm text-gray-400">
          Sports and casino bets — including pending and settled statuses — are
          tracked in My Bets.
        </p>
        <button
          type="button"
          onClick={() => navigate("/casino/my-bets")}
          className="mt-5 rounded-md bg-gray-700 px-5 py-2 font-semibold hover:bg-gray-600"
        >
          Open My Bets
        </button>
      </section>
    </main>
  );
};

export default BetArcheive;
