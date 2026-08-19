import { useCallback, useEffect, useState } from "react";
import { apiService } from "../../config/api";
import {
  initializeSportsSocket,
  onEventStateHandler,
  onMarketSuspendedHandler,
  onOddsUpdateHandler,
  onScoreboardUpdateHandler,
  subscribeSport,
  unsubscribeSport,
} from "../../socket/sports";
import EventCard from "./EventCard";

const applyOddsUpdate = (events, update) =>
  events.map((event) => {
    if (event._id !== update.eventId) return event;
    return {
      ...event,
      markets: (event.markets || []).map((market) => {
        if (market._id !== update.marketId) return market;
        const priceByKey = new Map(
          (update.outcomes || []).map((outcome) => [
            outcome.key,
            outcome.priceDecimal,
          ])
        );
        return {
          ...market,
          selections: (market.selections || []).map((selection) =>
            priceByKey.has(selection.key)
              ? { ...selection, priceDecimal: priceByKey.get(selection.key) }
              : selection
          ),
        };
      }),
    };
  });

const EventList = ({ sportKey }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    try {
      setError("");
      const res = await apiService.sports.getEvents({
        sportKey,
        hydrate: 1,
        limit: 40,
      });
      setEvents(res.data?.events || []);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Could not load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sportKey]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    initializeSportsSocket(token);
    subscribeSport(sportKey);

    const cleanups = [
      onOddsUpdateHandler((update) => {
        setEvents((current) => applyOddsUpdate(current, update));
      }),
      onEventStateHandler((update) => {
        setEvents((current) =>
          current.map((event) =>
            event._id === update.eventId
              ? { ...event, status: update.status }
              : event
          )
        );
      }),
      onScoreboardUpdateHandler((update) => {
        setEvents((current) =>
          current.map((event) =>
            event._id === update.eventId
              ? { ...event, scoreboard: update.scoreboard }
              : event
          )
        );
      }),
      onMarketSuspendedHandler((update) => {
        setEvents((current) =>
          current.map((event) =>
            event._id === update.eventId
              ? {
                  ...event,
                  markets: (event.markets || []).map((market) =>
                    market._id === update.marketId
                      ? { ...market, status: update.status }
                      : market
                  ),
                }
              : event
          )
        );
      }),
    ];

    return () => {
      unsubscribeSport(sportKey);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [sportKey]);

  const liveEvents = events.filter((event) => event.status === "live");
  const upcomingEvents = events.filter((event) => event.status === "upcoming");

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-400">Loading events…</div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">{error}</p>
        <button
          type="button"
          onClick={loadEvents}
          className="mt-3 rounded-md bg-primary-1 px-4 py-2 text-sm text-white hover:bg-activeHover"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="py-10 text-center text-gray-400">
        No events available right now. Check back soon.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {liveEvents.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Live now
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {liveEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-white">Upcoming</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {upcomingEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default EventList;
