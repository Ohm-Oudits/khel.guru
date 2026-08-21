import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

let kenoSocket = null;

export const initializeKenoSocket = (token) => {
  if (kenoSocket && kenoSocket.connected) {
    console.log("Keno socket already initialized and connected");
    return kenoSocket;
  }

  kenoSocket = io(`${API_URL}/keno`, {
    auth: {
      token: token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  kenoSocket.on("connect", () => {
    console.log(
      "Keno namespace connected successfully, socket ID:",
      kenoSocket.id
    );
  });

  kenoSocket.on("connect_error", (error) => {
    console.error("Keno namespace connection error:", error.message);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Keno socket");
      disconnectKenoSocket();
    }
  });

  kenoSocket.on("disconnect", () => {
    console.log("Keno namespace disconnected");
  });

  return kenoSocket;
};

export const getKenoSocket = () => {
  return kenoSocket;
};

export const disconnectKenoSocket = () => {
  if (kenoSocket) {
    kenoSocket.disconnect();
    kenoSocket = null;
    console.log("Keno socket disconnected and reset");
  }
};
