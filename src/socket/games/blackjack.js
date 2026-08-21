import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

let blackjackSocket = null;

// Event handlers object to store callbacks
const eventHandlers = {
  onGameState: null,
  onError: null,
  onGameOver: null,
};

export const initializeBlackjackSocket = (token) => {
  if (!blackjackSocket) {
    blackjackSocket = io(`${API_URL}/blackjack`, {
      auth: {
        token: token,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
    });

    blackjackSocket.on("connect", () => {
      console.log("Blackjack namespace connected successfully");
    });

    blackjackSocket.on("connect_error", (error) => {
      console.error("Blackjack namespace connection error:", error);
      if (
        error.message === "Authentication required" ||
        error.message === "Invalid token"
      ) {
        console.log("Authentication failed, disconnecting Blackjack socket");
        disconnectBlackjackSocket();
      }
    });

    blackjackSocket.on("disconnect", () => {
      console.log("Blackjack namespace disconnected");
    });

    // Set up persistent event listeners
    blackjackSocket.on("game_state_update", (data) => {
      if (eventHandlers.onGameState) {
        eventHandlers.onGameState(data);
      }
    });

    blackjackSocket.on("error", (error) => {
      // Don't treat "game not found" as an error
      if (error.message === "Game not found") {
        console.log("No active game found");
        return;
      }
      console.error("Blackjack socket error:", error);
      if (eventHandlers.onError) {
        eventHandlers.onError(error);
      }
    });

    blackjackSocket.on("game_over", (data) => {
      if (eventHandlers.onGameOver) {
        eventHandlers.onGameOver(data);
      }
    });
  }
  return blackjackSocket;
};

export const getBlackjackSocket = () => blackjackSocket;

export const disconnectBlackjackSocket = () => {
  if (blackjackSocket) {
    blackjackSocket.disconnect();
    blackjackSocket = null;
  }
};

// Game event handlers
export const getGameState = (callback) => {
  if (blackjackSocket) {
    blackjackSocket.emit("get_game_state");
    blackjackSocket.once("initial_game_state", callback);
  }
};

export const addGame = (callback) => {
  if (blackjackSocket) {
    blackjackSocket.emit("add_game");
    blackjackSocket.once("game_state_update", callback);
  }
};

export const placeBet = (betAmount, callback, walletType = "demo") => {
  if (blackjackSocket) {
    blackjackSocket.emit("place_bet", { betAmount, walletType });
    blackjackSocket.once("game_state_update", callback);
  }
};

export const hit = (callback) => {
  if (blackjackSocket) {
    blackjackSocket.emit("hit");
    blackjackSocket.once("game_state_update", callback);
  }
};

export const stand = (callback) => {
  if (blackjackSocket) {
    blackjackSocket.emit("stand");
    blackjackSocket.once("game_state_update", callback);
  }
};

export const split = (callback) => {
  if (blackjackSocket) {
    blackjackSocket.emit("split");
    blackjackSocket.once("game_state_update", callback);
  }
};

export const double = (callback) => {
  if (blackjackSocket) {
    blackjackSocket.emit("double");
    blackjackSocket.once("game_state_update", callback);
  }
};

// Event listeners
export const onGameState = (callback) => {
  if (blackjackSocket) {
    eventHandlers.onGameState = callback;
  }
};

export const onError = (callback) => {
  if (blackjackSocket) {
    eventHandlers.onError = callback;
  }
};

export const onGameOver = (callback) => {
  if (blackjackSocket) {
    eventHandlers.onGameOver = callback;
  }
};

// Remove event listeners
export const removeGameStateListener = () => {
  if (blackjackSocket) {
    blackjackSocket.off("game_state_update");
    eventHandlers.onGameState = null;
  }
};

export const removeErrorListener = () => {
  if (blackjackSocket) {
    blackjackSocket.off("error");
    eventHandlers.onError = null;
  }
};

export const removeGameOverListener = () => {
  if (blackjackSocket) {
    blackjackSocket.off("game_over");
    eventHandlers.onGameOver = null;
  }
};
