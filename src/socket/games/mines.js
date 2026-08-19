import { io } from "socket.io-client";

let minesSocket = null;
const API_URL = import.meta.env.VITE_APP_SOCKET_URL;

export const initializeMinesSocket = (token) => {
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
  minesSocket.emit("add_game", { betAmount, mines, walletType });
  return true;
};
