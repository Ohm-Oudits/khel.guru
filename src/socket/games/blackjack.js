import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

let blackjackSocket = null;

export const initializeBlackjackSocket = (token) => {
  if (blackjackSocket) {
    if (token) {
      blackjackSocket.auth = { token };
    }
    if (!blackjackSocket.connected) {
      blackjackSocket.connect();
    }
    return blackjackSocket;
  }

  blackjackSocket = io(`${API_URL}/blackjack`, {
    auth: {
      token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
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
      disconnectBlackjackSocket();
    }
  });

  return blackjackSocket;
};

export const getBlackjackSocket = () => blackjackSocket;

export const disconnectBlackjackSocket = () => {
  if (blackjackSocket) {
    blackjackSocket.disconnect();
    blackjackSocket = null;
  }
};
