import { useSearchParams } from "react-router-dom";
import { useSportsLiveEvent } from "../../hooks/useSportsLiveBoard";
import { hasPublishedScore } from "../../utils/sportsEventStatus";
import OddsButton from "./OddsButton";

const MARKET_SECTIONS = [
  {
    types: ["h2h"],
    title: "Match Winner",
    subtitle: "Head-to-head",
  },
  {
    types: ["spreads"],
    title: "Handicap",
    subtitle: "Spread bets",
  },
  {
    types: ["totals"],
    title: "Totals & score",
    subtitle: "Over / under and score lines",
  },
  {
    types: ["outrights"],
    title: "Outrights",
    subtitle: "Tournament and winner markets",
  },
  {
    types: ["other"],
    title: "More markets",
    subtitle: "Props, extras, and uncategorized odds",
  },
];

const EventDetail = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");

  const { event, markets, loading, error } = useSportsLiveEvent(eventId);

  if (loading) {
    return (
      <div className="py-10 text-center text-text-tertiary">Loading event…</div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-10 text-center text-text-tertiary">
        {error || "Event not found."}
      </div>
    );
  }

  const [home, away] = event.competitors || [];
  const scoreboard = event.scoreboard || {};
  const isLive = event.status === "live";
  const publishedScore = hasPublishedScore(scoreboard, {
    cricket: event.sportGroup === "cricket",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/5 bg-background-tertiary p-5">
        <p className="text-xs uppercase tracking-wide text-text-tertiary">
          {event.leagueName || event.sportName}
        </p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-white">
            {home?.name} <span className="text-text-tertiary">vs</span> {away?.name}
          </h1>
          {isLive ? (
            <div className="text-right">
              {publishedScore ? (
                <p className="text-xl font-bold text-white">
                  {scoreboard.homeWickets != null
                    ? `${scoreboard.home ?? 0}-${scoreboard.homeWickets}`
                    : scoreboard.home ?? 0}{" "}
                  -{" "}
                  {scoreboard.awayWickets != null
                    ? `${scoreboard.away ?? 0}-${scoreboard.awayWickets}`
                    : scoreboard.away ?? 0}
                </p>
              ) : null}
              <p className="text-xs text-red-400">
                LIVE
                {scoreboard.minute !== undefined
                  ? ` · ${scoreboard.minute}'`
                  : ""}
                {scoreboard.awayOvers != null
                  ? ` · ${scoreboard.awayOvers} ov`
                  : scoreboard.homeOvers != null
                    ? ` · ${scoreboard.homeOvers} ov`
                    : scoreboard.overs !== undefined
                      ? ` · ${scoreboard.overs} ov`
                      : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">
              {event.startTime
                ? new Date(event.startTime).toLocaleString()
                : ""}
            </p>
          )}
        </div>
      </div>

      {markets.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-background-tertiary p-5 text-center text-text-tertiary">
          No markets available for this event.
        </div>
      )}

      {MARKET_SECTIONS.map((section) => {
        const sectionMarkets = markets.filter(
          (market) =>
            section.types.includes(market.marketType || "other") &&
            !/_lay$/i.test(String(market.providerMarketKey || ""))
        );
        if (!sectionMarkets.length) return null;

        return (
          <section key={section.title} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {section.title}
              </h2>
              <p className="text-xs text-text-tertiary">{section.subtitle}</p>
            </div>
            {sectionMarkets.map((market) => (
              <div key={market._id} className="rounded-xl border border-white/5 bg-background-tertiary p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{market.title}</h3>
                  {market.status !== "open" && (
                    <span className="rounded bg-background-surface px-2 py-0.5 text-xs uppercase text-text-tertiary">
                      {market.status}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
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
            ))}
          </section>
        );
      })}
    </div>
  );
};

export default EventDetail;
