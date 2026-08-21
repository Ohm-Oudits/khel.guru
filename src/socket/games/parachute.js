import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

let parachuteSocket = null;
const historyBridgeFlags = {
  round_history: false,
  game_crashed: false,
  checkout_success: false,
};

const historyListeners = new Set();

const notifyHistoryListeners = (event) => {
  historyListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error("Parachute history listener error:", error);
    }
  });
};

const attachHistoryBridge = () => {
  if (!parachuteSocket) return;

  if (!historyBridgeFlags.round_history) {
    parachuteSocket.on("round_history", (payload) => {
      notifyHistoryListeners({ type: "history", ...payload });
    });
    historyBridgeFlags.round_history = true;
  }

  if (!historyBridgeFlags.game_crashed) {
    parachuteSocket.on("game_crashed", (payload) => {
      notifyHistoryListeners({ type: "crash", ...payload });
    });
    historyBridgeFlags.game_crashed = true;
  }

  if (!historyBridgeFlags.checkout_success) {
    parachuteSocket.on("checkout_success", (payload) => {
      notifyHistoryListeners({ type: "checkout", ...payload });
    });
    historyBridgeFlags.checkout_success = true;
  }
};

export const subscribeParachuteHistory = (listener) => {
  historyListeners.add(listener);
  return () => historyListeners.delete(listener);
};

export const initializeParachuteSocket = (token) => {
  if (!token) return null;

  if (parachuteSocket) {
    attachHistoryBridge();
    return parachuteSocket;
  }

  parachuteSocket = io(`${API_URL}/parachute`, {
    auth: {
      token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  parachuteSocket.on("connect", () => {
    console.log("Parachute namespace connected successfully");
    parachuteSocket.emit("get_history");
  });

  parachuteSocket.on("connect_error", (error) => {
    console.error("Parachute namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting parachute socket");
      disconnectParachuteSocket();
    }
  });

  parachuteSocket.on("disconnect", () => {
    console.log("Parachute namespace disconnected");
  });

  attachHistoryBridge();
  return parachuteSocket;
};

export const getParachuteSocket = () => parachuteSocket;

export const disconnectParachuteSocket = () => {
  if (parachuteSocket) {
    parachuteSocket.disconnect();
    parachuteSocket = null;
  }
  historyBridgeFlags.round_history = false;
  historyBridgeFlags.game_crashed = false;
  historyBridgeFlags.checkout_success = false;
};

export const addParachuteGame = (betAmount, difficulty, walletType = "demo") => {
  if (
    !parachuteSocket ||
    betAmount == null ||
    Number.isNaN(Number(betAmount)) ||
    Number(betAmount) < 0
  ) {
    return false;
  }
  parachuteSocket.emit("add_game", { betAmount, difficulty, walletType });
  return true;
};

export const checkoutParachute = () => {
  if (!parachuteSocket) return false;
  parachuteSocket.emit("checkout", {});
  return true;
};
