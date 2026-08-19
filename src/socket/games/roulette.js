import { io } from "socket.io-client";
import { toast } from "react-toastify";

let rouletteSocket = null;

export const initializeRouletteSocket = (token) => {
  if (!rouletteSocket) {
    const API_URL = import.meta.env.VITE_APP_SOCKET_URL;
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
        error.message === "Invalid token"
      ) {
        console.log("[Roulette] Authentication failed, disconnecting socket");
        disconnectRouletteSocket();
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    });

    rouletteSocket.on("disconnect", () => {
      console.log("[Roulette] Disconnected from socket");
    });
  }
  return rouletteSocket;
};

export const getRouletteSocket = () => rouletteSocket;

export const disconnectRouletteSocket = () => {
  if (rouletteSocket) {
    rouletteSocket.disconnect();
    rouletteSocket = null;
  }
};

export const joinGame = (callback) => {
  if (rouletteSocket) {
    rouletteSocket.emit("join_game");
    rouletteSocket.once("game_joined", callback);
  }
};

export const placeBet = (bets, totalAmount, callback, walletType = "demo") => {
  console.log("[Roulette] Attempting to place bet:", {
    bets,
    totalAmount,
    walletType,
    socketConnected: !!rouletteSocket?.connected,
  });

  if (!rouletteSocket?.connected) {
    console.error("[Roulette] Cannot place bet: Socket not connected");
    callback?.({ success: false, message: "Socket not connected" });
    return;
  }

  if (!bets || typeof bets !== "object" || Array.isArray(bets)) {
    console.error("[Roulette] Invalid bets object:", bets);
    callback?.({ success: false, message: "Invalid bets format" });
    return;
  }

  if (
    typeof totalAmount !== "number" ||
    isNaN(totalAmount) ||
    totalAmount <= 0
  ) {
    console.error("[Roulette] Invalid total amount:", totalAmount);
    callback?.({ success: false, message: "Invalid total amount" });
    return;
  }

  const betTypes = Object.keys(bets);
  if (betTypes.length === 0) {
    console.error("[Roulette] No bets provided");
    callback?.({ success: false, message: "No bets provided" });
    return;
  }

  for (const [betType, amount] of Object.entries(bets)) {
    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      console.error("[Roulette] Invalid bet amount for", betType, ":", amount);
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
    console.error("[Roulette] Bet amount mismatch:", {
      provided: totalAmount,
      calculated: calculatedTotal,
    });
    callback?.({ success: false, message: "Bet amount mismatch" });
    return;
  }

  console.log("[Roulette] Emitting place_bet event:", {
    bets,
    totalAmount,
    betTypes,
  });

  try {
    rouletteSocket.off("bet_result");

    rouletteSocket.once("bet_result", (result) => {
      console.log("[Roulette] Bet result received:", result);
      if (callback) {
        callback(result);
      }
    });

    const betData = {
      bets: { ...bets },
      totalAmount: Number(totalAmount),
      walletType,
    };

    rouletteSocket.emit("place_bet", betData);
  } catch (error) {
    console.error("[Roulette] Error placing bet:", error);
    callback?.({ success: false, message: "Error placing bet" });
  }
};

export const onGameJoined = (callback) => {
  if (rouletteSocket) {
    rouletteSocket.on("game_joined", callback);
  }
};

export const onBetResult = (callback) => {
  if (rouletteSocket) {
    rouletteSocket.on("bet_result", (result) => {
      console.log("[Roulette] Bet result received:", result);
      callback(result);
    });
  }
};

export const onGameResult = (callback) => {
  if (rouletteSocket) {
    rouletteSocket.on("game_result", (result) => {
      console.log("[Roulette] Game result received:", result);
      callback(result);
    });
  }
};

export const onError = (callback) => {
  if (rouletteSocket) {
    rouletteSocket.on("error", (error) => {
      console.error("[Roulette] Socket error:", error);
      callback(error);
    });
  }
};

export const removeGameJoinedListener = () => {
  if (rouletteSocket) {
    rouletteSocket.off("game_joined");
  }
};

export const removeBetResultListener = () => {
  if (rouletteSocket) {
    rouletteSocket.off("bet_result");
  }
};

export const removeGameResultListener = () => {
  if (rouletteSocket) {
    rouletteSocket.off("game_result");
  }
};

export const removeErrorListener = () => {
  if (rouletteSocket) {
    rouletteSocket.off("error");
  }
};

export const removeAllListeners = () => {
  if (rouletteSocket) {
    removeGameJoinedListener();
    removeBetResultListener();
    removeGameResultListener();
    removeErrorListener();
  }
};
