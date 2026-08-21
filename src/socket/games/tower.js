import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";
import { getActiveWalletType } from "../../utils/activeWallet";

let towerSocket = null;

export const initializeTowerSocket = (token) => {
  if (towerSocket) return towerSocket;

  towerSocket = io(`${API_URL}/tower`, {
    auth: {
      token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
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

  return towerSocket;
};

export const getTowerSocket = () => towerSocket;

export const disconnectTowerSocket = () => {
  if (towerSocket) {
    towerSocket.disconnect();
    towerSocket = null;
  }
};

export const requestTowerGameState = () => {
  if (!towerSocket) return false;
  towerSocket.emit("get_game_state");
  return true;
};

export const startTowerGame = (
  betAmount,
  difficulty,
  walletType = getActiveWalletType()
) => {
  if (!towerSocket) return false;
  towerSocket.emit("add_game", { betAmount, difficulty, walletType });
  return true;
};

export const revealTowerBox = (index) => {
  if (!towerSocket) return false;
  towerSocket.emit("reveal", { index });
  return true;
};

export const checkoutTower = () => {
  if (!towerSocket) return false;
  towerSocket.emit("checkout");
  return true;
};

export const continueTowerGame = () => {
  if (!towerSocket) return false;
  towerSocket.emit("continue_game");
  return true;
};
