import { io } from "socket.io-client";

let crashSocket = null;
const API_URL = import.meta.env.VITE_APP_SOCKET_URL;

export const initializeCrashSocket = (token) => {
  // Reuse a live socket instead of churning a new connection on every mount —
  // recreating it mid-handshake dropped in-flight bets ("closed before
  // established").
  if (crashSocket) return crashSocket;

  crashSocket = io(`${API_URL}/crash`, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  crashSocket.on("connect", () => {
    console.log("crash namespace connected successfully");
  });

  crashSocket.on("connect_error", (error) => {
    console.error("Crash namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Crash socket");
      disconnectCrashSocket();
    }
  });

  crashSocket.on("disconnect", () => {
    console.log("Crash namespace disconnected");
  });
};

export const getCrashSocket = () => {
  return crashSocket;
};

export const disconnectCrashSocket = () => {
  if (crashSocket) {
    crashSocket.disconnect();
    crashSocket = null;
  }
};

// Commit a stake to the current round (debits the wallet server-side).
export const placeCrashBet = (betAmount, walletType = "demo") => {
  if (!crashSocket || !betAmount || betAmount <= 0) return false;
  crashSocket.emit("place_bet", { betAmount, walletType });
  return true;
};

// Cash out the active bet at the given multiplier (credits stake x multiplier).
export const cashOutCrash = (multiplier) => {
  if (!crashSocket) return false;
  crashSocket.emit("cash_out", { multiplier });
  return true;
};

// The round crashed before a cashout: forfeit the active bet (no credit).
export const bustCrash = () => {
  if (!crashSocket) return false;
  crashSocket.emit("bust", {});
  return true;
};
