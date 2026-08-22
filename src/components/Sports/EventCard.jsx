import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usesMatchBoard } from "../../utils/footballBoard";
import { hasPublishedScore, isStumpsEvent } from "../../utils/sportsEventStatus";
import FootballEventCard from "./FootballEventCard";
import OddsButton from "./OddsButton";

const TEAM_FLAGS = {
  BAN: "bd",
  AUS: "au",
  IND: "in",
  ENG: "gb",
  PAK: "pk",
  NZ: "nz",
  SA: "za",
  SL: "lk",
  AFG: "af",
  IRE: "ie",
  ZIM: "zw",
  WI: "bb",
  VIC: "au",
  NSW: "au",
  QLD: "au",
  WA: "au",
  MI: "in",
  CSK: "in",
};

const formatStartTime = (startTime) => {
  if (!startTime) return "";
  const date = new Date(startTime);
  return `${date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  })} · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const formatCricketScore = (runs, wickets) => {
  if (runs === null || runs === undefined || runs === "") return "";
  if (wickets === null || wickets === undefined || Number(wickets) >= 10) {
    return String(runs);
  }
  return `${runs}-${wickets}`;
};

const formatOvers = (overs) => {
  if (overs === null || overs === undefined || overs === "") return "";
  return Number(overs).toFixed(1);
};

const teamCodeOf = (team) =>
  (team?.shortName || team?.name || "—").slice(0, 3).toUpperCase();

const flagUrlOf = (team) => {
  const code = TEAM_FLAGS[teamCodeOf(team)];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
};

const selectionForTeam = (market, team) => {
  if (!market || !team) return null;
  const name = String(team.name || "").toLowerCase();
  const shortName = String(team.shortName || "").toLowerCase();
  return (market.selections || []).find((selection) => {
    const selectionName = String(selection.name || "").toLowerCase();
    const key = String(selection.key || "").toLowerCase();
    return (
      selectionName === name ||
      selectionName === shortName ||
      key === name.replace(/\s+/g, "_") ||
      (shortName && (key === shortName || key.includes(shortName)))
    );
  });
};

const TeamMark = ({ team }) => {
  const flagUrl = flagUrlOf(team);
  const code = teamCodeOf(team);

  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt=""
        className="h-5 w-5 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background-surface text-[9px] font-bold text-text-secondary">
      {code.slice(0, 2)}
    </span>
  );
};

const TeamRow = ({
  team,
  runs,
  wickets,
  overs,
  batting,
  showScore,
  market,
  event,
  highlight,
}) => {
  const selection = selectionForTeam(market, team);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <TeamMark team={team} />
        <span
          className={`w-10 text-sm font-semibold ${
            highlight ? "text-white" : "text-text-secondary"
          }`}
        >
          {teamCodeOf(team)}
        </span>
        {showScore ? (
          <>
            <span
              className={`min-w-[3.5rem] text-sm font-bold tabular-nums ${
                highlight ? "text-brand-primary" : "text-white"
              }`}
            >
              {formatCricketScore(runs, wickets)}
            </span>
            <span className="flex items-center gap-1 text-xs tabular-nums text-text-tertiary">
              {formatOvers(overs)}
              {batting ? <span aria-hidden="true">🏏</span> : null}
            </span>
          </>
        ) : (
          <span className="truncate text-sm text-text-primary">
            {team?.name || teamCodeOf(team)}
          </span>
        )}
      </div>
      {selection ? (
        <OddsButton event={event} market={market} selection={selection} compact />
      ) : (
        <span className="text-sm text-text-muted">—</span>
      )}
    </div>
  );
};

const EventCard = ({ event, eventPathBase }) => {
  const navigate = useNavigate();
  const [showFantasy, setShowFantasy] = useState(false);
  if (usesMatchBoard(event.sportGroup)) {
    return <FootballEventCard event={event} eventPathBase={eventPathBase} />;
  }
  const [home, away] = event.competitors || [];
  const scoreboard = event.scoreboard || {};
  const isStumps = isStumpsEvent(event);
  const isLive = event.status === "live" && !isStumps;
  const isCompleted =
    event.status === "settled" || event.status === "completed";
  const isCricket = event.sportGroup === "cricket";
  const showScore =
    isStumps ||
    isCompleted ||
    (isLive &&
      hasPublishedScore(scoreboard, { cricket: isCricket }));

  const isLayMarket = (market) =>
    /_lay$/i.test(String(market?.providerMarketKey || ""));
  const h2hMarket = (event.markets || []).find(
    (market) => market.marketType === "h2h" && !isLayMarket(market)
  );
  const fantasyMarkets = (event.markets || []).filter(
    (market) =>
      !isLayMarket(market) &&
      (market.marketType === "other" || market.marketType === "totals")
  );

  const detailPath = `${
    eventPathBase ||
    `/sports/${event.sportGroup || "cricket"}/leagues/${
      event.sportKey || event.sportGroup || "cricket"
    }`
  }/bet?eventId=${event._id}`;

  const heading =
    scoreboard.title || event.leagueName || event.sportName || "Match";
  const venue = scoreboard.venue || event.metadata?.venue || "";
  const battingSide = scoreboard.batting || "";
  const summary =
    scoreboard.note ||
    (scoreboard.day ? `Day ${scoreboard.day}` : "") ||
    (!isLive ? formatStartTime(event.startTime) : "");
  const usedSelectionKeys = new Set(
    [selectionForTeam(h2hMarket, home), selectionForTeam(h2hMarket, away)]
      .filter(Boolean)
      .map((selection) => selection.key)
  );
  const extraSelections = (h2hMarket?.selections || []).filter(
    (selection) => !usedSelectionKeys.has(selection.key)
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-background-tertiary px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-text-tertiary">
          {heading}
          {venue ? ` · ${venue}` : ""}
        </p>
        {isLive ? (
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Live
          </span>
        ) : isStumps ? (
          <span className="shrink-0 text-xs font-semibold text-amber-300">
            Stumps
          </span>
        ) : isCompleted ? (
          <span className="shrink-0 text-xs font-semibold text-text-tertiary">
            Completed
          </span>
        ) : (
          <span className="shrink-0 text-xs text-text-muted">
            {formatStartTime(event.startTime)}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2.5">
        <TeamRow
          team={home}
          runs={scoreboard.home}
          wickets={scoreboard.homeWickets}
          overs={
            scoreboard.homeOvers ??
            (battingSide === "home" ? scoreboard.overs : null)
          }
          batting={isLive && isCricket && battingSide === "home"}
          showScore={showScore}
          highlight={isLive && battingSide === "home"}
          market={h2hMarket}
          event={event}
        />
        <TeamRow
          team={away}
          runs={scoreboard.away}
          wickets={scoreboard.awayWickets}
          overs={
            scoreboard.awayOvers ??
            (battingSide === "away" ? scoreboard.overs : null)
          }
          batting={isLive && isCricket && battingSide === "away"}
          showScore={showScore}
          highlight={isLive && battingSide === "away"}
          market={h2hMarket}
          event={event}
        />
        {extraSelections.map((selection) => (
          <div
            key={selection.key}
            className="grid grid-cols-[1fr_auto] items-center gap-3"
          >
            <span className="pl-7 text-sm text-text-secondary">
              {selection.name}
            </span>
            <OddsButton
              event={event}
              market={h2hMarket}
              selection={selection}
              compact
            />
          </div>
        ))}
      </div>

      {summary ? (
        <p className="mt-3 text-xs font-medium text-text-tertiary">{summary}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={() => navigate(detailPath)}
          className="text-xs font-semibold text-brand-primary hover:text-interactive-primaryHover"
        >
          More markets
        </button>
        <button
          type="button"
          onClick={() => setShowFantasy((open) => !open)}
          className="text-xs font-semibold text-brand-primary hover:text-interactive-primaryHover"
        >
          {showFantasy ? "Hide fantasy" : "Fantasy odds"}
        </button>
      </div>

      {showFantasy && (
        <div className="mt-3 space-y-3 rounded-lg bg-background-surface p-3">
          {fantasyMarkets.length ? (
            fantasyMarkets.map((market) => (
              <div key={market._id || market.providerMarketKey}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {market.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(market.selections || []).map((selection) => (
                    <OddsButton
                      key={selection.key}
                      event={event}
                      market={market}
                      selection={selection}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-tertiary">
              No fantasy markets on this match yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCard;
