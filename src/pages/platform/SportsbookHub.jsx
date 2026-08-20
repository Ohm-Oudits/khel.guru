import { useEffect, useMemo, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import EventCard from "../../components/Sports/EventCard";
import LiveWinFeed from "../../components/platform/LiveWinFeed";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { apiService } from "../../config/api";
import { sportsbookBrowseLinks } from "../../config/platformNavigation";

const RECENTS_STORAGE_KEY = "kg.recent.sports";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "simulation", label: "Simulation" },
  { key: "recents", label: "Recents", hideOnMobile: true },
  { key: "trending", label: "Trending" },
];

// The real sport categories (the trailing browse links are meta shortcuts).
const SPORT_CARDS = sportsbookBrowseLinks.slice(0, 4);

const sportLikes = (sport) => {
  const seed = String(sport.label)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 6100 + (seed * 911) % 88000;
};

const formatCount = (count) =>
  count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);

const sportsByLikes = [...SPORT_CARDS].sort((a, b) => sportLikes(b) - sportLikes(a));

const sportGroupOf = (sport) => sport.label.toLowerCase();

const safeReadStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const safeWriteStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in unsupported environments.
  }
};

// Same tile shape as the home/casino game cards: cover art + name + likes.
const SportCard = ({ sport, onOpen }) => (
  <Link
    to={sport.path}
    onClick={() => onOpen(sport.label)}
    className="group overflow-hidden rounded-xl border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
  >
    <div className="flex aspect-[4/5] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(0,212,170,0.28),_transparent_45%),linear-gradient(180deg,_rgba(8,8,8,0.9),_rgba(18,18,18,1))]">
      <sport.icon className="text-5xl text-brand-primary" />
    </div>
    <div className="flex items-center justify-between gap-1 p-2">
      <h3 className="truncate text-sm font-bold text-white">{sport.label}</h3>
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-tertiary">
        {formatCount(sportLikes(sport))}
        <FaHeart className="text-[10px] text-red-500" />
      </span>
    </div>
  </Link>
);

const SportsbookHub = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [recentSports, setRecentSports] = useState([]);

  useEffect(() => {
    setRecentSports(safeReadStorage(RECENTS_STORAGE_KEY));
  }, []);

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

  const registerRecentSport = (label) => {
    const next = [label, ...recentSports.filter((entry) => entry !== label)].slice(0, 6);
    setRecentSports(next);
    safeWriteStorage(RECENTS_STORAGE_KEY, next);
  };

  const liveSportGroups = useMemo(
    () => new Set(liveEvents.map((event) => event.sportGroup)),
    [liveEvents]
  );

  const simulationEvents = useMemo(
    () =>
      [...liveEvents, ...upcomingEvents].filter((event) =>
        /sim|mock/i.test(event.provider || "")
      ),
    [liveEvents, upcomingEvents]
  );

  const recentSportCards = recentSports
    .map((label) => SPORT_CARDS.find((sport) => sport.label === label))
    .filter(Boolean);

  const renderSportGrid = (cards) => (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {cards.map((sport) => (
        <SportCard key={sport.label} sport={sport} onOpen={registerRecentSport} />
      ))}
    </section>
  );

  const renderEventGrid = (events) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );

  const hasAnyEvents = liveEvents.length > 0 || upcomingEvents.length > 0;

  return (
    <PlatformPage>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black text-white">Sports</h1>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                filter.hideOnMobile ? "hidden sm:inline-flex" : ""
              } ${
                activeFilter === filter.key
                  ? "border-brand-primary bg-brand-primary text-black"
                  : "border-white/10 bg-white/5 text-text-secondary hover:border-brand-primary/40 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* ALL — sport cards first (by likes), then live + upcoming events */}
      {activeFilter === "all" && (
        <>
          {renderSportGrid(sportsByLikes)}
          {liveEvents.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Live now
              </h2>
              {renderEventGrid(liveEvents)}
            </section>
          )}
          {upcomingEvents.length > 0 && (
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
              {renderEventGrid(upcomingEvents)}
            </section>
          )}
        </>
      )}

      {/* LIVE — live quick-bet cards, then sport cards that have live events */}
      {activeFilter === "live" && (
        <>
          {liveEvents.length > 0 ? (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Live bets
              </h2>
              {renderEventGrid(liveEvents)}
            </section>
          ) : (
            <p className="text-sm text-text-secondary">No live events right now.</p>
          )}
          {(() => {
            const liveSports = sportsByLikes.filter((sport) =>
              liveSportGroups.has(sportGroupOf(sport))
            );
            return liveSports.length ? (
              <section>
                <h2 className="mb-3 text-xl font-black text-white">Live sports</h2>
                {renderSportGrid(liveSports)}
              </section>
            ) : null;
          })()}
        </>
      )}

      {/* SIMULATION — events coming from the simulated feed */}
      {activeFilter === "simulation" &&
        (simulationEvents.length ? (
          <section>
            <h2 className="mb-3 text-xl font-black text-white">Simulated markets</h2>
            {renderEventGrid(simulationEvents)}
          </section>
        ) : (
          <p className="text-sm text-text-secondary">
            No simulated markets in the feed right now.
          </p>
        ))}

      {/* RECENTS — recently opened sports */}
      {activeFilter === "recents" &&
        (recentSportCards.length ? (
          renderSportGrid(recentSportCards)
        ) : (
          <p className="text-sm text-text-secondary">
            No recently viewed sports yet — open one to get started.
          </p>
        ))}

      {/* TRENDING — top 5 live plays as quick bets */}
      {activeFilter === "trending" &&
        (liveEvents.length ? (
          <section>
            <h2 className="mb-3 text-xl font-black text-white">
              Trending live now
            </h2>
            {renderEventGrid(liveEvents.slice(0, 5))}
          </section>
        ) : (
          <p className="text-sm text-text-secondary">
            No live plays to trend right now.
          </p>
        ))}

      {!hasAnyEvents && activeFilter !== "recents" && (
        <PlatformPanel>
          <p className="text-sm text-text-secondary">
            No events in the feed yet. Once the sportsbook scheduler is running
            (or an ingest is triggered), live and upcoming fixtures appear here
            automatically.
          </p>
        </PlatformPanel>
      )}

      <PlatformPanel>
        <LiveWinFeed variant="sports" rows={15} title="Live Sports Wins" />
      </PlatformPanel>
    </PlatformPage>
  );
};

export default SportsbookHub;
