import { io } from "socket.io-client";
import { SOCKET_URL as API_URL } from "../../config/backendUrls";

const SOCKET_KEY = "__KG_PUMP_SOCKET__";

let pumpSocket = null;

const readSharedSocket = () => {
  if (typeof window !== "undefined" && window[SOCKET_KEY]) {
    pumpSocket = window[SOCKET_KEY];
  }
  return pumpSocket;
};

const shareSocket = (socket) => {
  pumpSocket = socket;
  if (typeof window !== "undefined") {
    window[SOCKET_KEY] = socket;
  }
};

export const initializePumpSocket = (token) => {
  if (!token) return null;

  const existing = readSharedSocket();
  if (existing) {
    return existing;
  }

  const socket = io(`${API_URL}/pump`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
  });

  socket.on("connect", () => {
    console.log("Pump namespace connected successfully");
    socket.emit("get_history");
  });

  socket.on("connect_error", (error) => {
    console.error("Pump namespace connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("Authentication failed, disconnecting Pump socket");
      disconnectPumpSocket();
    }
  });

  socket.on("disconnect", () => {
    console.log("Pump namespace disconnected");
  });

  shareSocket(socket);
  return socket;
};

export const getPumpSocket = () => readSharedSocket() || pumpSocket;

export const disconnectPumpSocket = () => {
  if (pumpSocket) {
    pumpSocket.disconnect();
  }
  pumpSocket = null;
  if (typeof window !== "undefined") {
    delete window[SOCKET_KEY];
  }
};

export const placePumpBet = (betAmount, walletType = "demo", risk = "Low") => {
  const socket = getPumpSocket();
  if (
    !socket ||
    betAmount == null ||
    Number.isNaN(Number(betAmount)) ||
    Number(betAmount) < 0
  ) {
    return false;
  }
  socket.emit("place_bet", { betAmount, walletType, risk });
  return true;
};

export const pumpRound = () => {
  const socket = getPumpSocket();
  if (!socket) return false;
  socket.emit("pump", {});
  return true;
};

export const cashOutPump = () => {
  const socket = getPumpSocket();
  if (!socket) return false;
  socket.emit("cash_out", {});
  return true;
};

export const bustPump = () => {
  const socket = getPumpSocket();
  if (!socket) return false;
  socket.emit("bust", {});
  return true;
};
