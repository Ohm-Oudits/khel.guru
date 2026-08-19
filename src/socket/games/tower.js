import { io } from "socket.io-client";

let towerSocket = null;
const API_URL = import.meta.env.VITE_APP_SOCKET_URL;

export const initializeTowerSocket = (token) => {
  towerSocket = io(`${API_URL}/tower`, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  towerSocket.on("connect", () => {
    console.log("Tower namespace connected successfully");
  });

  towerSocket.on("connect_error", (error) => {
    console.error("Tower namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Tower socket");
      disconnectTowerSocket();
    }
  });

  towerSocket.on("disconnect", () => {
    console.log("Tower namespace disconnected");
  });
};

export const getTowerSocket = () => {
  return towerSocket;
};

export const disconnectTowerSocket = () => {
  if (towerSocket) {
    towerSocket.disconnect();
    towerSocket = null;
  }
};

// Start a new tower round, staking betAmount from the given wallet
// (demo default).
export const startTowerGame = (betAmount, difficulty, walletType = "demo") => {
  if (!towerSocket) return false;
  towerSocket.emit("add_game", { betAmount, difficulty, walletType });
  return true;
};
