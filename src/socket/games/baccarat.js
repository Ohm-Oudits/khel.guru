import { io } from "socket.io-client";

let baccaratSocket = null;
const API_URL = import.meta.env.VITE_APP_SOCKET_URL;

export const initializeBaccaratSocket = (token) => {
  baccaratSocket = io(`${API_URL}/baccarat`, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  baccaratSocket.on("connect", () => {
    console.log("Baccarat namespace connected successfully");
  });

  baccaratSocket.on("connect_error", (error) => {
    console.error("Baccarat namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Baccarat socket");
      disconnectBaccaratSocket();
    }
  });

  baccaratSocket.on("disconnect", () => {
    console.log("Baccarat namespace disconnected");
  });
};

export const getBaccaratSocket = () => {
  return baccaratSocket;
};

export const disconnectBaccaratSocket = () => {
  if (baccaratSocket) {
    baccaratSocket.disconnect();
    baccaratSocket = null;
  }
};

// Join the current baccarat table (the server acks with "game_joined").
export const joinBaccaratGame = () => {
  if (!baccaratSocket) return false;
  baccaratSocket.emit("join_game");
  return true;
};

// Stake `amount` on player/tie/banker from the given wallet (demo default).
export const placeBaccaratBet = (betType, amount, walletType = "demo") => {
  if (!baccaratSocket) return false;
  baccaratSocket.emit("place_bet", { betType, amount, walletType });
  return true;
};

// Ask the server to deal and settle the round.
export const startBaccaratDealing = (walletType = "demo") => {
  if (!baccaratSocket) return false;
  baccaratSocket.emit("start_dealing", { walletType });
  return true;
};
