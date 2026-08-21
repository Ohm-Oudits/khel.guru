import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";
import { getActiveWalletType } from "../../utils/activeWallet";

let twistSocket = null;

export const initializeTwistSocket = (token) => {
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
    twistSocket.emit("get_state");
  });

  twistSocket.on("connect_error", (error) => {
    console.error("Twist namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      disconnectTwistSocket();
    }
  });

  twistSocket.on("disconnect", () => {
    console.log("Twist namespace disconnected");
  });

  return twistSocket;
};

export const getTwistSocket = () => {
  return twistSocket;
};

export const placeBet = (betAmount, walletType = getActiveWalletType()) => {
  if (!twistSocket) return false;
  twistSocket.emit("place_bet", { betAmount, walletType });
  return true;
};

export const cashoutTwist = () => {
  if (!twistSocket) return false;
  twistSocket.emit("cashout");
  return true;
};

export const partialCashoutTwist = () => {
  if (!twistSocket) return false;
  twistSocket.emit("partial_cashout");
  return true;
};

export const requestTwistState = () => {
  if (!twistSocket) return false;
  twistSocket.emit("get_state");
  return true;
};

export const disconnectTwistSocket = () => {
  if (twistSocket) {
    twistSocket.disconnect();
    twistSocket = null;
  }
};
