import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

let minesSocket = null;

export const initializeMinesSocket = (token) => {
  // Reuse a live socket instead of churning a new connection on every mount —
  // recreating it mid-handshake dropped in-flight bets ("closed before
  // established").
  if (minesSocket) return minesSocket;

  minesSocket = io(`${API_URL}/mines`, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  minesSocket.on("connect", () => {
    console.log("Mines namespace connected successfully");
  });

  minesSocket.on("connect_error", (error) => {
    console.error("Mines namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Mines socket");
      disconnectMinesSocket();
    }
  });

  minesSocket.on("disconnect", () => {
    console.log("Mines namespace disconnected");
  });

  return minesSocket;
};

export const getMinesSocket = () => {
  return minesSocket;
};

export const disconnectMinesSocket = () => {
  if (minesSocket) {
    minesSocket.disconnect();
    minesSocket = null;
  }
};

// Start a round: commits the stake (debited server-side from walletType).
export const addMinesGame = (betAmount, mines, walletType = "demo") => {
  if (!minesSocket) return false;
  minesSocket.emit("add_game", {
    betAmount: Number(betAmount),
    mines: Number(mines),
    walletType,
  });
  return true;
};
