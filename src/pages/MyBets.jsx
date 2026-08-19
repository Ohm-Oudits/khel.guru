import { useCallback, useEffect, useState } from "react";
import { FaBitcoin } from "react-icons/fa";
import { GiRolledCloth } from "react-icons/gi";
import { IoBalloon } from "react-icons/io5";
import List from "../components/MainFrame/List";
import { apiService } from "../config/api";
import { onBetSettled } from "../socket/betNotifications";

const STATUS_STYLES = {
  pending: "bg-yellow-500/10 text-yellow-300",
  won: "bg-green-500/10 text-green-400",
  lost: "bg-red-500/10 text-red-400",
  void: "bg-gray-500/10 text-gray-300",
  cashed_out: "bg-blue-500/10 text-blue-300",
  rejected: "bg-red-500/10 text-red-400",
};

const StatusChip = ({ status }) => (
  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
      STATUS_STYLES[status] || "bg-gray-500/10 text-gray-300"
    }`}
  >
    {status}
  </span>
);

const SportsBets = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBets = useCallback(async () => {
    try {
      const res = await apiService.sports.getBetHistory({ limit: 50 });
      setBets(res.data?.bets || []);
    } catch (error) {
      console.error("Failed to load bet history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBets();
    // Settlements arrive over the default socket; refetch to flip statuses.
    return onBetSettled(loadBets);
  }, [loadBets]);

  if (loading) {
    return <p className="py-10 text-center text-gray-400">Loading bets…</p>;
  }

  if (!bets.length) {
    return (
      <p className="py-10 text-center text-gray-400">
        No sports bets yet. Pick an event in the sportsbook to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="w-full text-center text-md text-white">
        <thead>
          <tr className="h-12 text-gray-400">
            <th className="py-2 pl-3 text-left">Event</th>
            <th className="py-2 text-left">Selection</th>
            <th className="py-2">Odds</th>
            <th className="py-2">Stake</th>
            <th className="py-2">Status</th>
            <th className="py-2 pr-3 text-right">Payout</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((bet, index) => {
            const event = bet.eventId || {};
            const eventName = (event.competitors || [])
              .map((competitor) => competitor.name)
              .join(" vs ");
            const settled = bet.status === "won";
            return (
              <tr
                key={bet._id}
                className={`h-12 ${index % 2 === 0 ? "bg-gray-800" : ""}`}
              >
                <td className="max-w-[220px] truncate py-2 pl-3 text-left">
                  <p className="truncate">{eventName || "—"}</p>
                  <p className="truncate text-xs text-gray-400">
                    {event.leagueName || event.sportName || ""}
                  </p>
                </td>
                <td className="max-w-[160px] truncate py-2 text-left">
                  {bet.selectionName}
                  {bet.selectionLine !== null &&
                  bet.selectionLine !== undefined
                    ? ` ${bet.selectionLine}`
                    : ""}
                </td>
                <td className="py-2">{Number(bet.priceDecimal).toFixed(2)}</td>
                <td className="py-2">₹{Number(bet.stake).toFixed(2)}</td>
                <td className="py-2">
                  <StatusChip status={bet.status} />
                </td>
                <td className="py-2 pr-3 text-right">
                  {settled
                    ? `₹${Number(bet.potentialPayout).toFixed(2)}`
                    : bet.status === "pending"
                    ? `₹${Number(bet.potentialPayout).toFixed(2)} potential`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Mybets = () => {
  const [activeTab, setActiveTab] = useState("Casino");

  const history = [
    {
      game: "Pump",
      bet_id: "12345678",
      date: "9:48 PM 2/5/2025 ",
      amount: "0.000002",
      multipler: 1.23,
    },
    {
      game: "Pump",
      bet_id: "12345678",
      date: "9:48 PM 2/5/2025 ",
      amount: "0.000002",
      multipler: 1.23,
    },
    {
      game: "Pump",
      bet_id: "12345678",
      date: "9:48 PM 2/5/2025 ",
      amount: "0.000002",
      multipler: 1.23,
    },
  ];

  return (
    <section className="max-w-[1200px] mx-auto w-full">
      <div className="flex pt-10 text-white ">
        {" "}
        <GiRolledCloth size={35} className="text-gray-400" />
        <span className="text-white my-1 font-semibold text-xl">
          My Bets
        </span>{" "}
      </div>
      <div className="flex justify-between mb-4 w-fit my-5 bg-gray-800 p-2 rounded-full">
        <button
          className={`flex-1 p-2 text-white px-5  rounded-full transition-all ${
            activeTab === "Casino" ? "bg-gray-700" : "bg-transparent"
          }`}
          onClick={() => setActiveTab("Casino")}
        >
          Casino
        </button>
        <button
          className={`flex-1 p-2 text-white px-5 rounded-full transition-all ${
            activeTab === "Sports" ? "bg-gray-700" : "bg-transparent"
          }`}
          onClick={() => setActiveTab("Sports")}
        >
          Sports
        </button>
      </div>

      {activeTab === "Sports" ? (
        <SportsBets />
      ) : (
        <div className=" text-white  rounded-lg  space-y-4">
          <div className=" p-3 px-2 rounded-lg">
            <table className="w-full text-center text-white text-md">
              <thead>
                <tr className=" border-gray-900 h-12 text-gray-400 ">
                  <th className="py-2 pl-3 text-left">Game</th>
                  <th className="py-2">Bet Id</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Bet Amount</th>
                  <th className="py-2">Multiplier</th>
                  <th className="py-2 text-right pr-3">Payout</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr
                    key={index}
                    className={` h-12 ${index % 2 === 0 ? "bg-gray-800" : ""}`}
                  >
                    <td className="py-2 pl-3 text-left flex gap-x-2">
                      {" "}
                      <IoBalloon size={20} className="text-white" />{" "}
                      {entry.game}
                    </td>
                    <td className="py-2">{entry.bet_id}</td>
                    <td className="py-2">{entry.date}</td>
                    <td className="py-2">${entry.amount}</td>
                    <td className="py-2">{entry.multipler} x</td>
                    <td className="py-2  text-right pr-3 flex justify-end items-center">
                      {(entry.amount * entry.multipler).toFixed(8)}
                      <FaBitcoin className="ml-1 text-yellow-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-4">
        <List />
      </div>
    </section>
  );
};

export default Mybets;
