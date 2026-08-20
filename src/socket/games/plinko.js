import { io } from "socket.io-client";

let plinkoSocket = null;
const API_URL = import.meta.env.VITE_APP_SOCKET_URL;

export const initializePlinkoSocket = (token) => {
  // Reuse a live socket instead of churning a new connection on every mount —
  // recreating it mid-handshake dropped in-flight bets ("closed before
  // established").
  if (plinkoSocket) return plinkoSocket;

  plinkoSocket = io(`${API_URL}/plinko`, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  plinkoSocket.on("connect", () => {
    console.log("plinko namespace connected successfully");
  });

  plinkoSocket.on("connect_error", (error) => {
    console.error("Plinko namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Plinko socket");
      disconnectPlinkoSocket();
    }
  });

  plinkoSocket.on("disconnect", () => {
    console.log("Plinko namespace disconnected");
  });
};

export const getPlinkoSocket = () => {
  return plinkoSocket;
};

export const disconnectPlinkoSocket = () => {
  if (plinkoSocket) {
    plinkoSocket.disconnect();
    plinkoSocket = null;
  }
};
