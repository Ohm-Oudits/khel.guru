import { io } from "socket.io-client";
import { SOCKET_URL } from "../../config/backendUrls";

let rouletteSocket = null;

export const initializeRouletteSocket = (token) => {
  if (rouletteSocket) {
    rouletteSocket.auth = { token };
    if (!rouletteSocket.connected) {
      rouletteSocket.connect();
    }
    return rouletteSocket;
  }

  const API_URL = SOCKET_URL;
  rouletteSocket = io(`${API_URL}/roulette`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  rouletteSocket.on("connect", () => {
    console.log("[Roulette] Connected to socket");
  });

  rouletteSocket.on("connect_error", (error) => {
    console.error("[Roulette] Socket connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token" ||
      error.message === "Authentication token required"
    ) {
      console.log("[Roulette] Authentication failed, disconnecting socket");
      disconnectRouletteSocket();
    }
  });

  rouletteSocket.on("disconnect", () => {
    console.log("[Roulette] Disconnected from socket");
  });

  return rouletteSocket;
};

export const getRouletteSocket = () => rouletteSocket;

export const disconnectRouletteSocket = () => {
  if (rouletteSocket) {
    rouletteSocket.removeAllListeners();
    rouletteSocket.disconnect();
    rouletteSocket = null;
  }
};

const subscribe = (event, callback) => {
  if (!rouletteSocket) {
    return () => {};
  }
  rouletteSocket.on(event, callback);
  return () => rouletteSocket.off(event, callback);
};

export const joinGame = (callback) => {
  if (!rouletteSocket) {
    return;
  }
  rouletteSocket.emit("join_game");
  rouletteSocket.once("game_joined", callback);
};

export const placeBet = (bets, totalAmount, callback, walletType = "demo") => {
  if (!rouletteSocket?.connected) {
    callback?.({ success: false, message: "Socket not connected" });
    return;
  }

  if (!bets || typeof bets !== "object" || Array.isArray(bets)) {
    callback?.({ success: false, message: "Invalid bets format" });
    return;
  }

  if (
    typeof totalAmount !== "number" ||
    isNaN(totalAmount) ||
    totalAmount < 0
  ) {
    callback?.({ success: false, message: "Invalid total amount" });
    return;
  }

  if (Object.keys(bets).length === 0) {
    callback?.({ success: false, message: "No bets provided" });
    return;
  }

  for (const [betType, amount] of Object.entries(bets)) {
    if (typeof amount !== "number" || isNaN(amount) || amount < 0) {
      callback?.({
        success: false,
        message: `Invalid bet amount for ${betType}`,
      });
      return;
    }
  }

  const calculatedTotal = Object.values(bets).reduce(
    (sum, amount) => sum + amount,
    0
  );
  if (Math.abs(calculatedTotal - totalAmount) > 0.000001) {
    callback?.({ success: false, message: "Bet amount mismatch" });
    return;
  }

  const onResult = (result) => {
    rouletteSocket.off("bet_result", onResult);
    callback?.(result);
  };

  rouletteSocket.on("bet_result", onResult);
  rouletteSocket.emit("place_bet", {
    bets: { ...bets },
    totalAmount: Number(totalAmount),
    walletType,
  });
};

export const subscribeGameJoined = (callback) =>
  subscribe("game_joined", callback);

export const subscribeBetResult = (callback) =>
  subscribe("bet_result", callback);

export const subscribeGameResult = (callback) =>
  subscribe("game_result", callback);

export const subscribeSocketError = (callback) => subscribe("error", callback);

/** @deprecated use subscribe* helpers with returned unsubscribe */
export const onGameJoined = subscribeGameJoined;
export const onBetResult = subscribeBetResult;
export const onGameResult = subscribeGameResult;
export const onError = subscribeSocketError;

export const removeAllListeners = () => {
  if (rouletteSocket) {
    rouletteSocket.off("game_joined");
    rouletteSocket.off("bet_result");
    rouletteSocket.off("game_result");
    rouletteSocket.off("error");
  }
};
