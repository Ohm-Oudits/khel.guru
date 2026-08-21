import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/backendUrls";

let socket = null;

export const initializeSocket = (token) => {
  if (!token) {
    console.log("No token provided, socket connection aborted");
    return null;
  }

  if (socket) {
    socket.disconnect();
  }

  const API_URL = SOCKET_URL;

  socket = io(API_URL, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  socket.on("connect", () => {
    console.log("Socket connected successfully");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting socket");
      disconnectSocket();
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return { socket };
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
