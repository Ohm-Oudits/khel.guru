import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

let twistSocket = null;

export const initializeTwistSocket = (token) => {
  // Reuse a live socket instead of churning a new connection on every mount —
  // recreating it mid-handshake dropped in-flight bets ("closed before
  // established").
  if (twistSocket) return twistSocket;

  twistSocket = io(`${API_URL}/twist`, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  twistSocket.on("connect", () => {
    console.log("Twist namespace connected successfully");
  });

  twistSocket.on("connect_error", (error) => {
    console.error("Twist namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Twist socket");
      disconnectTwistSocket();
    }
  });

  twistSocket.on("disconnect", () => {
    console.log("Twist namespace disconnected");
  });
};

export const getTwistSocket = () => {
  return twistSocket;
};

// Debit the spin's stake from the wallet.
export const placeBet = (betAmount, walletType = "demo") => {
  if (!twistSocket) return false;
  twistSocket.emit("place_bet", { betAmount, walletType });
  return true;
};

export const disconnectTwistSocket = () => {
  if (twistSocket) {
    twistSocket.disconnect();
    twistSocket = null;
  }
};
