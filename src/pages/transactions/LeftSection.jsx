import { useNavigate } from "react-router-dom";

const TABS = [
  { label: "Deposits", path: "/transactions/deposits" },
  { label: "Withdrawals", path: "/transactions/withdrawals" },
  { label: "Bet Archive", path: "/transactions/bet-archive" },
  { label: "Other", path: "/transactions/other" },
];

export const TransactionType = ({ type }) => {
  const navigate = useNavigate();
  return (
    <div className="w-[200px] h-fit py-2 rounded-md bg-gray-900">
      {TABS.map((tab) => (
        <div
          onClick={() => navigate(tab.path)}
          key={tab.label}
          className={`py-4 cursor-pointer pl-3 pr-10 ${
            type === tab.label ? "border-l-4 bg-gray-700 border-green-500" : ""
          }`}
        >
          <div>{tab.label}</div>
        </div>
      ))}
    </div>
  );
};
