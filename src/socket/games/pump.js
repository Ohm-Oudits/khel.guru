import { io } from "socket.io-client";

let pumpSocket = null;
const API_URL = import.meta.env.VITE_APP_SOCKET_URL;

export const initializePumpSocket = (token) => {
  pumpSocket = io(`${API_URL}/pump`, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  pumpSocket.on("connect", () => {
    console.log("Pump namespace connected successfully");
  });

  pumpSocket.on("connect_error", (error) => {
    console.error("Pump namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Pump socket");
      disconnectPumpSocket();
    }
  });

  pumpSocket.on("disconnect", () => {
    console.log("Pump namespace disconnected");
  });
};

export const getPumpSocket = () => {
  return pumpSocket;
};

export const disconnectPumpSocket = () => {
  if (pumpSocket) {
    pumpSocket.disconnect();
    pumpSocket = null;
  }
};

// Commit a stake to the current round (debits the wallet server-side).
export const placePumpBet = (betAmount, walletType = "demo") => {
  if (!pumpSocket || !betAmount || betAmount <= 0) return false;
  pumpSocket.emit("place_bet", { betAmount, walletType });
  return true;
};

// Cash out the active bet at the given multiplier (credits stake x multiplier).
export const cashOutPump = (multiplier) => {
  if (!pumpSocket) return false;
  pumpSocket.emit("cash_out", { multiplier });
  return true;
};

// The balloon popped before a cashout: forfeit the active bet (no credit).
export const bustPump = () => {
  if (!pumpSocket) return false;
  pumpSocket.emit("bust", {});
  return true;
};
