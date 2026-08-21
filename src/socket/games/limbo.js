import { io } from "socket.io-client";
import { SOCKET_URL } from "../../config/backendUrls";

let limboSocket = null;

// Socket initialization and management
export const initializeLimboSocket = (token) => {
  if (limboSocket) return limboSocket;

  const API_URL = SOCKET_URL;
  limboSocket = io(`${API_URL}/limbo`, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  limboSocket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    if (error.message === "Authentication failed") {
      localStorage.removeItem("token");
      window.location.href = "/?tab=login";
    }
  });

  limboSocket.on("connect", () => {
    console.log("Connected to Limbo socket");
  });

  return limboSocket;
};

export const getLimboSocket = () => limboSocket;

export const disconnectLimboSocket = () => {
  if (limboSocket) {
    limboSocket.disconnect();
    limboSocket = null;
  }
};

// Game event handlers
export const joinGame = (callback) => {
  if (limboSocket) {
    limboSocket.emit("join_game");
    limboSocket.once("game_joined", callback);
  }
};

export const placeBet = (
  betAmount,
  targetMultiplier,
  callback,
  walletType = "demo"
) => {
  if (limboSocket) {
    limboSocket.emit("place_bet", { betAmount, targetMultiplier, walletType });
    limboSocket.once("bet_result", callback);
  }
};

// Event listeners
export const onBetResult = (callback) => {
  if (limboSocket) {
    limboSocket.off("bet_result");
    limboSocket.on("bet_result", callback);
  }
};

export const onError = (callback) => {
  if (limboSocket) {
    limboSocket.on("error", callback);
  }
};

// Remove event listeners
export const removeBetResultListener = () => {
  if (limboSocket) {
    limboSocket.off("bet_result");
  }
};

export const removeErrorListener = () => {
  if (limboSocket) {
    limboSocket.off("error");
  }
};
