import { useNavigate } from "react-router-dom";
import OddsButton from "./OddsButton";

const formatStartTime = (startTime) => {
  if (!startTime) return "";
  const date = new Date(startTime);
  return `${date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  })} · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const Scoreboard = ({ event }) => {
  const scoreboard = event.scoreboard || {};
  const [home, away] = event.competitors || [];

  if (event.sportGroup === "cricket") {
    return (
      <div className="text-right text-sm">
        <p className="text-white">
          {home?.shortName || home?.name}: {scoreboard.home ?? 0}
        </p>
        <p className="text-white">
          {away?.shortName || away?.name}: {scoreboard.away ?? 0}
        </p>
        <p className="text-xs text-gray-400">
          {scoreboard.innings ? `Innings ${scoreboard.innings}` : ""}
          {scoreboard.overs !== undefined ? ` · ${scoreboard.overs} ov` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="text-right text-sm">
      <p className="text-lg font-semibold text-white">
        {scoreboard.home ?? 0} - {scoreboard.away ?? 0}
      </p>
      {scoreboard.minute !== undefined && (
        <p className="text-xs text-gray-400">{scoreboard.minute}&apos;</p>
      )}
    </div>
  );
};

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const [home, away] = event.competitors || [];
  const isLive = event.status === "live";

  const h2hMarket = (event.markets || []).find(
    (market) => market.marketType === "h2h"
  );

  const detailPath = `/sports/${event.sportGroup || "cricket"}/bet?eventId=${
    event._id
  }`;

  return (
    <div className="rounded-lg bg-primary p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-wide text-gray-400">
            {event.leagueName || event.sportName}
          </p>
          <p className="mt-1 truncate font-semibold text-white">
            {home?.name} <span className="text-gray-400">vs</span> {away?.name}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-red-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                LIVE
              </span>
            ) : (
              formatStartTime(event.startTime)
            )}
          </p>
        </div>
        {isLive && <Scoreboard event={event} />}
      </div>

      {h2hMarket && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(h2hMarket.selections || []).map((selection) => (
            <OddsButton
              key={selection.key}
              event={event}
              market={h2hMarket}
              selection={selection}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate(detailPath)}
        className="mt-3 text-xs text-[#4391E7] hover:underline"
      >
        More markets
      </button>
    </div>
  );
};

export default EventCard;
