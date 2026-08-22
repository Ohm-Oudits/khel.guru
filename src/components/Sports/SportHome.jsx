import { useEffect, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { isCricketSportGroup } from "../../config/sportsbookGroups";
import BetSlipPanel from "./BetSlip/BetSlipPanel";
import EventList from "./EventList";
import SportSectionTabs from "./SportSectionTabs";

const SportHome = ({ sportKey }) => {
  const navigate = useNavigate();
  const showStumps = isCricketSportGroup(sportKey);
  const [section, setSection] = useState("live");
  const [counts, setCounts] = useState({
    live: 0,
    stumps: 0,
    upcoming: 0,
    completed: 0,
  });

  useEffect(() => {
    if (!showStumps && section === "stumps") setSection("live");
  }, [section, showStumps]);

  useEffect(() => {
    const order = showStumps
      ? ["live", "stumps", "upcoming", "completed"]
      : ["live", "upcoming", "completed"];
    if ((counts[section] || 0) > 0) return;
    const next = order.find((key) => (counts[key] || 0) > 0);
    if (next) setSection(next);
  }, [counts, section, showStumps]);

  return (
    <div
      className="mt-1 max-lg:pb-[90px] text-text-primary lg:rounded-lg bg-background-secondary py-2 px-6 max-md:px-3"
      style={{
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-[1200px]">
        <div className="my-6 flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/sports")}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-background-tertiary px-3 py-1.5 text-xs text-text-tertiary hover:bg-background-surface hover:text-text-secondary sm:px-4 sm:text-sm"
          >
            <FaChevronLeft />
          </button>
          <div className="min-w-0 flex-1">
            <SportSectionTabs
              section={section}
              onChange={setSection}
              counts={counts}
              showStumps={showStumps}
            />
          </div>
        </div>

        <EventList
          sportKey={sportKey}
          groupByLeague={!showStumps}
          section={section}
          onSectionChange={setSection}
          onCounts={setCounts}
          showTabs={false}
          showStumps={showStumps}
        />
      </div>
      <BetSlipPanel />
    </div>
  );
};

export default SportHome;
