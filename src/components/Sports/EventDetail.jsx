import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiService } from "../../config/api";
import {
  initializeSportsSocket,
  onEventStateHandler,
  onMarketSuspendedHandler,
  onOddsUpdateHandler,
  onScoreboardUpdateHandler,
  subscribeEvent,
  unsubscribeEvent,
} from "../../socket/sports";
import OddsButton from "./OddsButton";

const EventDetail = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [event, setEvent] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      setError("No event selected.");
      return;
    }
    try {
      setError("");
      const res = await apiService.sports.getEvent(eventId);
      setEvent(res.data?.event || null);
      setMarkets(res.data?.markets || []);
    } catch (err) {
      console.error("Failed to load event:", err);
      setError("Could not load this event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !eventId) return undefined;

    initializeSportsSocket(token);
    subscribeEvent(eventId);

    const cleanups = [
      onOddsUpdateHandler((update) => {
        if (update.eventId !== eventId) return;
        setMarkets((current) =>
          current.map((market) => {
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
                  ? {
                      ...selection,
                      priceDecimal: priceByKey.get(selection.key),
                    }
                  : selection
              ),
            };
          })
        );
      }),
      onEventStateHandler((update) => {
        if (update.eventId !== eventId) return;
        setEvent((current) =>
          current ? { ...current, status: update.status } : current
        );
      }),
      onScoreboardUpdateHandler((update) => {
        if (update.eventId !== eventId) return;
        setEvent((current) =>
          current ? { ...current, scoreboard: update.scoreboard } : current
        );
      }),
      onMarketSuspendedHandler((update) => {
        if (update.eventId !== eventId) return;
        setMarkets((current) =>
          current.map((market) =>
            market._id === update.marketId
              ? { ...market, status: update.status }
              : market
          )
        );
      }),
    ];

    return () => {
      unsubscribeEvent(eventId);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-400">Loading event…</div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-10 text-center text-gray-400">
        {error || "Event not found."}
      </div>
    );
  }

  const [home, away] = event.competitors || [];
  const scoreboard = event.scoreboard || {};
  const isLive = event.status === "live";

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary p-5">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          {event.leagueName || event.sportName}
        </p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-white">
            {home?.name} <span className="text-gray-400">vs</span> {away?.name}
          </h1>
          {isLive ? (
            <div className="text-right">
              <p className="text-xl font-bold text-white">
                {scoreboard.home ?? 0} - {scoreboard.away ?? 0}
              </p>
              <p className="text-xs text-red-400">
                LIVE
                {scoreboard.minute !== undefined
                  ? ` · ${scoreboard.minute}'`
                  : ""}
                {scoreboard.overs !== undefined
                  ? ` · ${scoreboard.overs} ov`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {event.startTime
                ? new Date(event.startTime).toLocaleString()
                : ""}
            </p>
          )}
        </div>
      </div>

      {markets.length === 0 && (
        <div className="rounded-lg bg-primary p-5 text-center text-gray-400">
          No markets available for this event.
        </div>
      )}

      {markets.map((market) => (
        <div key={market._id} className="rounded-lg bg-primary p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">{market.title}</h2>
            {market.status !== "open" && (
              <span className="rounded bg-primary-1 px-2 py-0.5 text-xs uppercase text-gray-400">
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
    </div>
  );
};

export default EventDetail;
