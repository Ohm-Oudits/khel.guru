import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

let crashSocket = null;

export const initializeCrashSocket = (token) => {
  const nextToken = token || null;
  if (crashSocket) {
    const currentToken = crashSocket.auth?.token || null;
    if (currentToken === nextToken) return crashSocket;
    disconnectCrashSocket();
  }

  crashSocket = io(`${API_URL}/crash`, {
    ...(nextToken ? { auth: { token: nextToken } } : {}),
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
  });

  crashSocket.on("connect", () => {
    console.log("crash namespace connected successfully");
  });

  crashSocket.on("connect_error", (error) => {
    console.error("Crash namespace connection error:", error);
    if (error.message === "Invalid token") {
      console.log("Authentication failed, disconnecting Crash socket");
      disconnectCrashSocket();
    }
  });

  crashSocket.on("disconnect", () => {
    console.log("Crash namespace disconnected");
  });

  return crashSocket;
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
  if (
    !crashSocket ||
    betAmount == null ||
    Number.isNaN(Number(betAmount)) ||
    betAmount < 0
  )
    return false;
  crashSocket.emit("place_bet", { betAmount, walletType });
  return true;
};

// Cash out the active bet at the current server multiplier.
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
