import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EventCard from "../../components/Sports/EventCard";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { apiService } from "../../config/api";
import { sportsbookBrowseLinks } from "../../config/platformNavigation";

const SportsbookHub = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [liveRes, upcomingRes] = await Promise.all([
          apiService.sports.getEvents({ status: "live", hydrate: 1, limit: 6 }),
          apiService.sports.getEvents({
            status: "upcoming",
            hydrate: 1,
            limit: 6,
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

  return (
    <PlatformPage>
      <PlatformHero
        eyebrow="Sportsbook"
        title="Cricket-first market discovery with faster entry into live and upcoming action."
        description="Live odds, real fixtures, and in-play scoreboards across cricket, football, tennis, and badminton — updated as the feed moves."
        tone="sportsbook"
      />

      {liveEvents.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Live now
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
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
