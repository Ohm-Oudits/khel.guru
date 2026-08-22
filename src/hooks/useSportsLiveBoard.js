import { useCallback, useEffect, useRef, useState } from "react";
import { apiService } from "../config/api";
import { matchesRequestedSport } from "../config/sportsbookGroups";
import {
  initializeSportsSocket,
  onEventStateHandler,
  onEventUpdateHandler,
  onLiveBoardHandler,
  onMarketSuspendedHandler,
  onOddsUpdateHandler,
  onScoreboardUpdateHandler,
  onSportSnapshotHandler,
  subscribeEvent,
  subscribeSport,
  unsubscribeEvent,
  unsubscribeSport,
} from "../socket/sports";

// List boards are socket-first. HTTP is a first-paint / retry snapshot only.
export const LIVE_BOARD_POLL_MS = 0;

export const sameId = (left, right) => String(left) === String(right);

const timestampOf = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

export const eventFreshness = (event = {}) =>
  Math.max(
    timestampOf(event.scoreboard?.liveSyncedAt),
    timestampOf(event.providerLastUpdate),
    timestampOf(event.updatedAt),
    ...(event.markets || []).flatMap((market) => [
      timestampOf(market.latestSnapshotAt),
      ...(market.selections || []).map((selection) =>
        timestampOf(selection.priceUpdatedAt)
      ),
    ])
  );

const isNewerOrEqual = (incoming, current) =>
  !current || eventFreshness(incoming) >= eventFreshness(current);

const isStaleScoreboard = (current, incoming) => {
  const currentAt = timestampOf(
    current?.liveSyncedAt || current?.providerLastUpdate
  );
  const incomingAt = timestampOf(
    incoming?.liveSyncedAt || incoming?.emittedAt
  );
  return currentAt > 0 && incomingAt > 0 && incomingAt < currentAt;
};

const marketMatchesUpdate = (market, update) =>
  sameId(market._id, update.marketId) ||
  (update.providerMarketKey &&
    market.providerMarketKey === update.providerMarketKey) ||
  (update.marketType &&
    !update.marketId &&
    market.marketType === update.marketType);

export const applyOddsUpdateToMarkets = (markets = [], update = {}) =>
  markets.map((market) => {
    if (!marketMatchesUpdate(market, update)) return market;
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
  });

export const applyOddsUpdateToEvents = (events, update) =>
  events.map((event) => {
    if (!sameId(event._id, update.eventId)) return event;
    return {
      ...event,
      markets: applyOddsUpdateToMarkets(event.markets, update),
    };
  });

export const mergeEventsByFreshness = (current = [], incoming = []) => {
  const byId = new Map(current.map((event) => [String(event._id), event]));

  for (const next of incoming) {
    const id = String(next._id);
    const previous = byId.get(id);
    if (isNewerOrEqual(next, previous)) {
      byId.set(id, next);
    }
  }

  const seen = new Set();
  const ordered = [];
  for (const next of incoming) {
    const id = String(next._id);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(byId.get(id));
  }
  for (const previous of current) {
    const id = String(previous._id);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(previous);
  }
  return ordered;
};

const connectSportsSocket = () => {
  const token = localStorage.getItem("token");
  if (token) initializeSportsSocket(token);
  return Boolean(token);
};

export const useSportsLiveBoard = ({
  sportKey,
  pollMs = LIVE_BOARD_POLL_MS,
} = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const httpReady = useRef(false);

  const fetchRows = useCallback(async () => {
    const params = { hydrate: 1, limit: 250 };
    if (sportKey) params.sportKey = sportKey;
    const { data } = await apiService.sports.getEvents(params);
    return data?.events || [];
  }, [sportKey]);

  const applyHttp = useCallback((rows) => {
    httpReady.current = true;
    setEvents(Array.isArray(rows) ? rows : []);
    setError("");
    setLoading(false);
  }, []);

  const reload = useCallback(async () => {
    try {
      setError("");
      applyHttp(await fetchRows());
    } catch (err) {
      console.error("Failed to load events:", err);
      if (!httpReady.current) {
        setError("Could not load events. Please try again.");
      }
      setLoading(false);
    }
  }, [applyHttp, fetchRows]);

  useEffect(() => {
    let cancelled = false;
    httpReady.current = false;
    setLoading(true);

    if (connectSportsSocket() && sportKey) {
      subscribeSport(sportKey);
    }

    const load = async () => {
      try {
        const rows = await fetchRows();
        if (!cancelled) applyHttp(rows);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load events:", err);
        if (!httpReady.current) {
          setError("Could not load events. Please try again.");
          setLoading(false);
        }
        // Keep polling; a later tick can recover without a manual retry.
      }
    };

    load();
    const pollTimer = pollMs > 0 ? window.setInterval(load, pollMs) : 0;

    const cleanups = [
      onSportSnapshotHandler((payload) => {
        if (
          sportKey &&
          payload?.sportKey &&
          !matchesRequestedSport(sportKey, payload.sportKey)
        ) {
          return;
        }
        const incoming = payload?.events || [];
        if (httpReady.current) {
          setEvents((current) => mergeEventsByFreshness(current, incoming));
          return;
        }
        setEvents(incoming);
        setLoading(false);
      }),
      onLiveBoardHandler((update) => {
        if (!update?.eventId) return;
        if (
          sportKey &&
          update.sportGroup &&
          !matchesRequestedSport(sportKey, update.sportGroup)
        ) {
          return;
        }
        setEvents((current) =>
          current.map((event) =>
            sameId(event._id, update.eventId)
              ? {
                  ...event,
                  status: update.status || event.status,
                  scoreboard: update.scoreboard || event.scoreboard,
                  markets: update.markets || event.markets,
                }
              : event
          )
        );
      }),
      onEventUpdateHandler((update) => {
        if (!update?.eventId) return;
        if (
          sportKey &&
          update.sportGroup &&
          !matchesRequestedSport(sportKey, update.sportGroup)
        ) {
          return;
        }
        setEvents((current) =>
          current.map((event) => {
            if (!sameId(event._id, update.eventId)) return event;
            if (
              update.scoreboard &&
              isStaleScoreboard(event.scoreboard, {
                ...update.scoreboard,
                emittedAt: update.emittedAt,
              })
            ) {
              return event;
            }
            return {
              ...event,
              ...(update.event || {}),
              status: update.status || event.status,
              scoreboard: update.scoreboard || event.scoreboard,
              markets: update.markets || event.markets,
            };
          })
        );
      }),
      onOddsUpdateHandler((update) => {
        setEvents((current) => applyOddsUpdateToEvents(current, update));
      }),
      onEventStateHandler((update) => {
        setEvents((current) =>
          current.map((event) =>
            sameId(event._id, update.eventId)
              ? { ...event, status: update.status }
              : event
          )
        );
      }),
      onScoreboardUpdateHandler((update) => {
        setEvents((current) =>
          current.map((event) => {
            if (!sameId(event._id, update.eventId)) return event;
            if (isStaleScoreboard(event.scoreboard, {
              ...update.scoreboard,
              emittedAt: update.emittedAt,
            })) {
              return event;
            }
            return { ...event, scoreboard: update.scoreboard };
          })
        );
      }),
      onMarketSuspendedHandler((update) => {
        setEvents((current) =>
          current.map((event) =>
            sameId(event._id, update.eventId)
              ? {
                  ...event,
                  markets: (event.markets || []).map((market) =>
                    marketMatchesUpdate(market, update)
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
      cancelled = true;
      if (pollTimer) window.clearInterval(pollTimer);
      if (sportKey) unsubscribeSport(sportKey);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [applyHttp, fetchRows, pollMs, sportKey]);

  const liveGroupsKey = events
    .map((event) => event.sportGroup)
    .filter(Boolean)
    .sort()
    .join(",");

  useEffect(() => {
    if (sportKey || !liveGroupsKey) return undefined;
    const groups = liveGroupsKey.split(",");
    groups.forEach((group) => subscribeSport(group));
    return () => groups.forEach((group) => unsubscribeSport(group));
  }, [liveGroupsKey, sportKey]);

  return { events, loading, error, reload };
};

export const useSportsLiveEvent = (
  eventId,
  { pollMs = LIVE_BOARD_POLL_MS } = {}
) => {
  const [event, setEvent] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const httpReady = useRef(false);

  const reload = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      setError("No event selected.");
      return;
    }
    try {
      const res = await apiService.sports.getEvent(eventId);
      httpReady.current = true;
      setEvent(res.data?.event || null);
      setMarkets(res.data?.markets || []);
      setError("");
    } catch (err) {
      console.error("Failed to load event:", err);
      if (!httpReady.current) setError("Could not load this event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    httpReady.current = false;
    setLoading(true);

    if (connectSportsSocket() && eventId) {
      subscribeEvent(eventId);
    }

    const load = async () => {
      if (cancelled) return;
      await reload();
    };
    load();
    const pollTimer = pollMs > 0 ? window.setInterval(load, pollMs) : 0;

    const cleanups = [
      onLiveBoardHandler((update) => {
        if (!sameId(update.eventId, eventId)) return;
        setEvent((current) =>
          current
            ? {
                ...current,
                status: update.status || current.status,
                scoreboard: update.scoreboard || current.scoreboard,
              }
            : current
        );
        if (update.markets) setMarkets(update.markets);
      }),
      onEventUpdateHandler((update) => {
        if (!sameId(update.eventId, eventId)) return;
        setEvent((current) => {
          if (!current) return update.event || current;
          if (
            update.scoreboard &&
            isStaleScoreboard(current.scoreboard, {
              ...update.scoreboard,
              emittedAt: update.emittedAt,
            })
          ) {
            return current;
          }
          return {
            ...current,
            ...(update.event || {}),
            status: update.status || current.status,
            scoreboard: update.scoreboard || current.scoreboard,
          };
        });
        if (update.markets) setMarkets(update.markets);
      }),
      onOddsUpdateHandler((update) => {
        if (!sameId(update.eventId, eventId)) return;
        setMarkets((current) => applyOddsUpdateToMarkets(current, update));
      }),
      onEventStateHandler((update) => {
        if (!sameId(update.eventId, eventId)) return;
        setEvent((current) =>
          current ? { ...current, status: update.status } : current
        );
      }),
      onScoreboardUpdateHandler((update) => {
        if (!sameId(update.eventId, eventId)) return;
        setEvent((current) => {
          if (!current) return current;
          if (
            isStaleScoreboard(current.scoreboard, {
              ...update.scoreboard,
              emittedAt: update.emittedAt,
            })
          ) {
            return current;
          }
          return { ...current, scoreboard: update.scoreboard };
        });
      }),
      onMarketSuspendedHandler((update) => {
        if (!sameId(update.eventId, eventId)) return;
        setMarkets((current) =>
          current.map((market) =>
            marketMatchesUpdate(market, update)
              ? { ...market, status: update.status }
              : market
          )
        );
      }),
    ];

    return () => {
      cancelled = true;
      if (pollTimer) window.clearInterval(pollTimer);
      if (eventId) unsubscribeEvent(eventId);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [eventId, pollMs, reload]);

  return { event, markets, loading, error, reload };
};
