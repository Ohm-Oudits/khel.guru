import { useEffect, useState } from "react";
import { FaChevronUp } from "react-icons/fa";
import { isCricketSportGroup } from "../../config/sportsbookGroups";
import { useSportsLiveBoard } from "../../hooks/useSportsLiveBoard";
import { formatLeagueHeading, groupEventsByLeague } from "../../utils/footballBoard";
import { bucketSportsEvents } from "../../utils/sportsEventStatus";
import EventCard from "./EventCard";
import SportSectionTabs from "./SportSectionTabs";

const EventList = ({
  sportKey,
  groupByLeague: shouldGroupByLeague = true,
  eventPathBase,
  section = "live",
  onSectionChange,
  onCounts,
  showTabs = true,
  showStumps,
}) => {
  const { events, loading, error, reload } = useSportsLiveBoard({ sportKey });
  const [internalSection, setInternalSection] = useState("live");
  const [collapsedLeagues, setCollapsedLeagues] = useState({});

  const activeSection = onSectionChange ? section : internalSection;
  const setActiveSection = onSectionChange || setInternalSection;

  const {
    live: liveEvents,
    stumps: stumpsEvents,
    upcoming: upcomingEvents,
    completed: completedEvents,
  } = bucketSportsEvents(events);
  const counts = {
    live: liveEvents.length,
    stumps: stumpsEvents.length,
    upcoming: upcomingEvents.length,
    completed: completedEvents.length,
  };

  useEffect(() => {
    onCounts?.(counts);
  }, [
    counts.live,
    counts.stumps,
    counts.upcoming,
    counts.completed,
    onCounts,
  ]);

  const renderEventGrid = (rows) => (
    <div className="grid gap-3 md:grid-cols-1">
      {rows.map((event) => (
        <EventCard
          key={event._id}
          event={event}
          eventPathBase={eventPathBase}
        />
      ))}
    </div>
  );

  const toggleLeague = (league) =>
    setCollapsedLeagues((current) => ({
      ...current,
      [league]: !current[league],
    }));

  const renderLeagueGroups = (rows) =>
    shouldGroupByLeague
      ? groupEventsByLeague(rows).map(({ key, league, events: leagueEvents }) => {
          const collapsed = Boolean(collapsedLeagues[key]);
          return (
            <section
              key={key}
              className="overflow-hidden rounded-xl border border-white/5 bg-background-tertiary"
            >
              <button
                type="button"
                onClick={() => toggleLeague(key)}
                className="flex w-full items-center justify-between gap-3 border-b border-white/5 bg-background-secondary px-3 py-2.5 text-left sm:px-4"
              >
                <h3 className="min-w-0 truncate text-sm font-semibold text-text-primary">
                  {formatLeagueHeading(league)}
                </h3>
                <FaChevronUp
                  className={`shrink-0 text-xs text-text-tertiary transition-transform ${
                    collapsed ? "rotate-180" : ""
                  }`}
                />
              </button>
              {collapsed ? null : (
                <div className="divide-y divide-white/5">
                  {leagueEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      eventPathBase={eventPathBase}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })
      : renderEventGrid(rows);

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-text-tertiary">{error}</p>
        <button
          type="button"
          onClick={reload}
          className="mt-3 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse"
        >
          Retry
        </button>
      </div>
    );
  }

  const stumpsEnabled =
    showStumps ?? isCricketSportGroup(sportKey);
  const resolvedSection =
    !stumpsEnabled && activeSection === "stumps" ? "live" : activeSection;
  const visibleEvents =
    resolvedSection === "upcoming"
      ? upcomingEvents
      : resolvedSection === "completed"
        ? completedEvents
        : resolvedSection === "stumps"
          ? stumpsEvents
          : liveEvents;

  return (
    <div className="min-w-0 space-y-4">
      {showTabs ? (
        <SportSectionTabs
          section={resolvedSection}
          onChange={setActiveSection}
          counts={counts}
          showStumps={stumpsEnabled}
        />
      ) : null}

      {loading ? (
        <div className="py-10 text-center text-text-tertiary">Loading events…</div>
      ) : visibleEvents.length ? (
        <div className="space-y-3">{renderLeagueGroups(visibleEvents)}</div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-background-tertiary px-4 py-8 text-center text-sm text-text-tertiary">
          {resolvedSection === "upcoming"
            ? "No upcoming games right now."
            : resolvedSection === "completed"
              ? "No completed games in the last 24 hours."
              : resolvedSection === "stumps"
                ? "No Test matches at stumps."
                : "No live games right now."}
        </div>
      )}
    </div>
  );
};

export default EventList;
