import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { SOCKET_URL } from "../../config/backendUrls";

let diceSocket = null;
let eventHandlers = {
  onGameJoined: null,
  onDiceResult: null,
  onDiceUpdate: null,
  onGameHistory: null,
  onError: null,
};

let isProcessingResult = false;

export const initializeDiceSocket = (token) => {
  if (diceSocket) {
    return;
  }

  const API_URL = SOCKET_URL;
  diceSocket = io(`${API_URL}/dice`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  diceSocket.on("connect", () => {
    console.log("Connected to dice socket");
  });

  diceSocket.on("connect_error", (error) => {
    console.error("Dice socket connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting dice socket");
      disconnectDiceSocket();
    }
  });

  diceSocket.on("disconnect", () => {
    console.log("Disconnected from dice socket");
    isProcessingResult = false;
  });

  diceSocket.on("game_joined", (data) => {
    console.log("Successfully joined dice game");
    if (eventHandlers.onGameJoined) {
      eventHandlers.onGameJoined(data);
    }
  });

  diceSocket.on("dice_result", (result) => {
    if (isProcessingResult) {
      return;
    }
    isProcessingResult = true;
    console.log("Dice roll result:", result);
    if (eventHandlers.onDiceResult) {
      eventHandlers.onDiceResult(result);
    }
    // Reset after a short delay to prevent race conditions
    setTimeout(() => {
      isProcessingResult = false;
    }, 1000);
  });

  diceSocket.on("dice_update", (update) => {
    // Only log updates, don't process them
    console.log("Dice game update:", update);
  });

  diceSocket.on("game_history", (history) => {
    if (eventHandlers.onGameHistory) {
      eventHandlers.onGameHistory(history);
    }
  });

  diceSocket.on("error", (error) => {
    console.error("Dice socket error:", error);
    if (eventHandlers.onError) {
      eventHandlers.onError(error.message);
    }
    isProcessingResult = false;
  });
};

export const disconnectDiceSocket = () => {
  if (diceSocket) {
    diceSocket.disconnect();
    diceSocket = null;
    isProcessingResult = false;
    // Clear all event handlers
    eventHandlers = {
      onGameJoined: null,
      onDiceResult: null,
      onDiceUpdate: null,
      onGameHistory: null,
      onError: null,
    };
  }
};

export const getDiceSocket = () => diceSocket;

export const joinGame = () => {
  if (!diceSocket) return false;
  diceSocket.emit("join_game");
  return true;
};

export const rollDice = (betAmount, prediction, rollUnder, walletType = "demo") => {
  if (!diceSocket || isProcessingResult) return false;
  if (
    betAmount == null ||
    Number.isNaN(Number(betAmount)) ||
    !prediction ||
    typeof rollUnder === "undefined"
  ) {
    console.error("Missing required parameters:", {
      betAmount,
      prediction,
      rollUnder,
    });
    return false;
  }
  diceSocket.emit("roll_dice", { betAmount, prediction, rollUnder, walletType });
  return true;
};

export const getHistory = () => {
  if (!diceSocket) return false;
  diceSocket.emit("get_history");
  return true;
};

// Event handler registration functions
export const onGameJoinedHandler = (callback) => {
  eventHandlers.onGameJoined = callback;
};

export const onDiceResultHandler = (callback) => {
  eventHandlers.onDiceResult = callback;
};

export const onDiceUpdateHandler = (callback) => {
  eventHandlers.onDiceUpdate = callback;
};

export const onGameHistoryHandler = (callback) => {
  eventHandlers.onGameHistory = callback;
};

export const onErrorHandler = (callback) => {
  eventHandlers.onError = callback;
};
