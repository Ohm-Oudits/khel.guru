import { io } from "socket.io-client";

let hiloSocket = null;

export const initializeHiloSocket = (token) => {
  if (!hiloSocket) {
    hiloSocket = io(`${import.meta.env.VITE_APP_SOCKET_URL}/hilo`, {
      auth: { token },
    });

    hiloSocket.on("connect", () => {
      console.log("Connected to Hilo socket");
    });

    hiloSocket.on("connect_error", (error) => {
      console.error("Hilo socket connection error:", error);
    });
  }
  return hiloSocket;
};

export const getHiloSocket = () => hiloSocket;

export const disconnectHiloSocket = () => {
  if (hiloSocket) {
    hiloSocket.disconnect();
    hiloSocket = null;
  }
};

// Game event handlers
export const getActiveGame = (callback) => {
  if (hiloSocket) {
    hiloSocket.emit("get_active_game");
    hiloSocket.once("game_state", callback);
  }
};

export const addGame = (betAmount, callback, walletType = "demo") => {
  if (hiloSocket) {
    hiloSocket.emit("add_game", { betAmount, walletType });
    hiloSocket.once("game_state", callback);
  }
};

export const predict = (prediction, callback) => {
  if (hiloSocket) {
    hiloSocket.emit("predict", { prediction });
    hiloSocket.once("game_state", callback);
  }
};

export const skip = (callback) => {
  if (hiloSocket) {
    hiloSocket.emit("skip");
    hiloSocket.once("game_state", callback);
  }
};

export const checkout = (callback) => {
  if (hiloSocket) {
    hiloSocket.emit("checkout");
    hiloSocket.once("game_state", callback);
  }
};

// Event listeners
export const onGameOver = (callback) => {
  if (hiloSocket) {
    hiloSocket.on("game_over", callback);
  }
};

export const onError = (callback) => {
  if (hiloSocket) {
    hiloSocket.on("error", callback);
  }
};

export const removeGameOverListener = () => {
  if (hiloSocket) {
    hiloSocket.off("game_over");
  }
};

export const removeErrorListener = () => {
  if (hiloSocket) {
    hiloSocket.off("error");
  }
};
