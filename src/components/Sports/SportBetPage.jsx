import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import BetSlipPanel from "./BetSlip/BetSlipPanel";
import EventDetail from "./EventDetail";

const SportBetPage = ({ sportKey, leagueKey, title }) => {
  const navigate = useNavigate();
  const backTo = leagueKey
    ? `/sports/${sportKey}/leagues/${leagueKey}`
    : `/sports/${sportKey}`;

  return (
    <div
      className="mt-1 max-lg:pb-[90px] text-text-primary lg:rounded-lg bg-background-secondary py-2 px-6 max-md:px-3"
      style={{
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="my-6 overflow-x-auto flex items-center gap-3">
          <div
            onClick={() => {
              navigate(backTo);
            }}
            className="rounded-xl bg-background-tertiary px-4 py-3 text-text-tertiary hover:bg-background-surface hover:text-text-secondary"
          >
            <FaChevronLeft className="text-base" />
          </div>
          <div>
            <h1 className="rounded-xl bg-background-tertiary px-5 py-2 font-semibold text-text-secondary">
              {title}
            </h1>
          </div>
        </div>

        <EventDetail />
      </div>
      <BetSlipPanel />
    </div>
  );
};

export default SportBetPage;
