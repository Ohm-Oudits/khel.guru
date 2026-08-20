import { useDeferredValue, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import EventCard from "../../components/Sports/EventCard";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { apiService } from "../../config/api";
import { sportsbookBrowseLinks } from "../../config/platformNavigation";

const matchesEvent = (event, query) => {
  if (!query) return true;
  const haystack = [
    event.sportName,
    event.leagueName,
    event.sportKey,
    event.sportGroup,
    ...(event.competitors || []).map((competitor) => competitor.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
};

const SportsbookHub = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [liveRes, upcomingRes] = await Promise.all([
          apiService.sports.getEvents({ status: "live", hydrate: 1, limit: 24 }),
          apiService.sports.getEvents({
            status: "upcoming",
            hydrate: 1,
            limit: 24,
          }),
        ]);
        if (cancelled) return;
        setLiveEvents(liveRes.data?.events || []);
        setUpcomingEvents(upcomingRes.data?.events || []);
      } catch (error) {
        console.error("Failed to load sportsbook hub events:", error);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredLive = liveEvents.filter((event) =>
    matchesEvent(event, normalizedQuery)
  );
  const filteredUpcoming = upcomingEvents.filter((event) =>
    matchesEvent(event, normalizedQuery)
  );
  const hasResults = filteredLive.length > 0 || filteredUpcoming.length > 0;

  return (
    <PlatformPage>
      <PlatformPanel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Discovery
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Search live and upcoming events across every sport
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">
              Find a team, league, or sport instantly — cricket-led markets plus
              football, tennis, and badminton, updated as the feed moves.
            </p>
          </div>

          <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 xl:min-w-[320px]">
            <FaSearch className="text-text-tertiary" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search teams, leagues, or sports"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-text-tertiary"
            />
          </label>
        </div>
      </PlatformPanel>

      {filteredLive.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Live now
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredLive.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

      {!normalizedQuery && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sportsbookBrowseLinks.map((item) => (
            <PlatformFeatureTile
              key={item.label}
              to={item.path}
              icon={item.icon}
              title={item.label}
              description={item.description}
            />
          ))}
        </section>
      )}

      {filteredUpcoming.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Upcoming</h2>
            <Link
              to="/sports/cricket"
              className="text-sm text-brand-accent hover:underline"
            >
              Browse all
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUpcoming.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

      {normalizedQuery && !hasResults && (
        <PlatformPanel>
          <h2 className="text-2xl font-black text-white">
            No events matched that search
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Try a team, league, or sport like India, EPL, or Cricket.
          </p>
        </PlatformPanel>
      )}

      {liveEvents.length === 0 && upcomingEvents.length === 0 && (
        <PlatformPanel>
          <p className="text-sm text-text-secondary">
            No events in the feed yet. Once the sportsbook scheduler is running
            (or an ingest is triggered), live and upcoming fixtures appear here
            automatically.
          </p>
        </PlatformPanel>
      )}
    </PlatformPage>
  );
};

export default SportsbookHub;
