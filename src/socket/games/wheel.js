import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

let wheelSocket = null;

// Socket initialization
export const initializeWheelSocket = (token) => {
  if (!wheelSocket) {
    wheelSocket = io(`${API_URL}/wheel`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
    });

    wheelSocket.on("connect", () => {
      console.log("Connected to Wheel socket");
    });

    wheelSocket.on("connect_error", (error) => {
      console.error("Wheel socket connection error:", error);
      if (
        error.message === "Authentication required" ||
        error.message === "Invalid token"
      ) {
        console.log("Authentication failed, disconnecting Wheel socket");
        disconnectWheelSocket();
      }
    });

    wheelSocket.on("disconnect", (reason) => {
      console.log("Wheel socket disconnected:", reason);
    });
  }
  return wheelSocket;
};

export const getWheelSocket = () => wheelSocket;

export const disconnectWheelSocket = () => {
  if (wheelSocket) {
    console.log("Disconnecting wheel socket");
    wheelSocket.disconnect();
    wheelSocket = null;
  }
};

// Game event handlers
export const playGame = (betData, callback) => {
  if (wheelSocket) {
    console.log("Sending bet request:", betData);
    wheelSocket.emit("play_game", betData, callback);
  } else {
    console.error("Wheel socket not initialized");
    if (callback) callback({ error: "Socket not initialized" });
  }
};

// Event listeners
export const onGameResult = (callback) => {
  if (wheelSocket) {
    wheelSocket.on("game_result", (result) => {
      console.log("Game result received:", result);
      callback(result);
    });
  }
};

export const onWheelUpdate = (callback) => {
  if (wheelSocket) {
    wheelSocket.on("wheel_update", (data) => {
      console.log("Wheel update received:", data);
      callback(data);
    });
  }
};

export const onError = (callback) => {
  if (wheelSocket) {
    wheelSocket.on("error", (error) => {
      console.error("Wheel game error:", error);
      callback(error);
    });
  }
};

// Remove event listeners
export const removeGameResultListener = () => {
  if (wheelSocket) {
    wheelSocket.off("game_result");
  }
};

export const removeWheelUpdateListener = () => {
  if (wheelSocket) {
    wheelSocket.off("wheel_update");
  }
};

export const removeErrorListener = () => {
  if (wheelSocket) {
    wheelSocket.off("error");
  }
};

// Remove all game-related listeners
export const removeAllGameListeners = () => {
  if (wheelSocket) {
    removeGameResultListener();
    removeWheelUpdateListener();
    removeErrorListener();
  }
};
