import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/backendUrls";

let sportsSocket = null;

// Unlike the single-consumer game sockets, several components listen to the
// sports feed at once (event lists, event detail, the bet slip), so each
// event type keeps a Set of handlers and registration returns a cleanup.
const eventHandlers = {
  odds_update: new Set(),
  event_state: new Set(),
  scoreboard_update: new Set(),
  market_suspended: new Set(),
  error: new Set(),
};

// Rooms survive reconnects: every join is tracked and re-emitted on connect.
const joinedEventRooms = new Set();
const joinedSportRooms = new Set();

const rejoinRooms = () => {
  if (!sportsSocket) return;
  joinedEventRooms.forEach((eventId) =>
    sportsSocket.emit("subscribe_event", { eventId })
  );
  joinedSportRooms.forEach((sportKey) =>
    sportsSocket.emit("subscribe_sport", { sportKey })
  );
};

const dispatchTo = (eventName, payload) => {
  eventHandlers[eventName].forEach((handler) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(`Sports ${eventName} handler failed:`, error);
    }
  });
};

export const initializeSportsSocket = (token) => {
  if (sportsSocket || !token) {
    return;
  }

  const API_URL = SOCKET_URL;
  sportsSocket = io(`${API_URL}/sports`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  sportsSocket.on("connect", () => {
    rejoinRooms();
  });

  sportsSocket.on("connect_error", (error) => {
    console.error("Sports socket connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      disconnectSportsSocket();
    }
  });

  Object.keys(eventHandlers).forEach((eventName) => {
    sportsSocket.on(eventName, (payload) => dispatchTo(eventName, payload));
  });
};

export const disconnectSportsSocket = () => {
  if (sportsSocket) {
    sportsSocket.disconnect();
    sportsSocket = null;
    joinedEventRooms.clear();
    joinedSportRooms.clear();
    Object.values(eventHandlers).forEach((handlers) => handlers.clear());
  }
};

export const getSportsSocket = () => sportsSocket;

export const subscribeEvent = (eventId) => {
  if (!sportsSocket || !eventId) return false;
  joinedEventRooms.add(eventId);
  sportsSocket.emit("subscribe_event", { eventId });
  return true;
};

export const unsubscribeEvent = (eventId) => {
  if (!sportsSocket || !eventId) return false;
  joinedEventRooms.delete(eventId);
  sportsSocket.emit("unsubscribe_event", { eventId });
  return true;
};

export const subscribeSport = (sportKey) => {
  if (!sportsSocket || !sportKey) return false;
  joinedSportRooms.add(sportKey);
  sportsSocket.emit("subscribe_sport", { sportKey });
  return true;
};

export const unsubscribeSport = (sportKey) => {
  if (!sportsSocket || !sportKey) return false;
  joinedSportRooms.delete(sportKey);
  sportsSocket.emit("unsubscribe_sport", { sportKey });
  return true;
};

const registerHandler = (eventName, callback) => {
  eventHandlers[eventName].add(callback);
  return () => eventHandlers[eventName].delete(callback);
};

export const onOddsUpdateHandler = (callback) =>
  registerHandler("odds_update", callback);

export const onEventStateHandler = (callback) =>
  registerHandler("event_state", callback);

export const onScoreboardUpdateHandler = (callback) =>
  registerHandler("scoreboard_update", callback);

export const onMarketSuspendedHandler = (callback) =>
  registerHandler("market_suspended", callback);

export const onErrorHandler = (callback) => registerHandler("error", callback);
