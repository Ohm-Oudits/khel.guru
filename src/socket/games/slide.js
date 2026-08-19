import { io } from "socket.io-client";

let slideSocket = null;
const API_URL = import.meta.env.VITE_APP_SOCKET_URL;

// Event handlers
let onGameStateHandler = null;
let onTimeUpdateHandler = null;
let onRoundResultHandler = null;
let onNewRoundHandler = null;
let onBetPlacedHandler = null;
let onAutoBetStartedHandler = null;
let onAutoBetUpdatedHandler = null;
let onAutoBetCompleteHandler = null;
let onErrorHandler = null;
let onBetsUpdatedHandler = null;
let onBetResultHandler = null;

export const initializeSlideSocket = (token) => {
  if (slideSocket) {
    return;
  }

  slideSocket = io(`${API_URL}/slide`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 3,
  });

  // Connection events
  slideSocket.on("connect", () => {
    console.log("[Slide] Connected to server");
    slideSocket.emit("join_game");
  });

  slideSocket.on("connect_error", (error) => {
    console.error("[Slide] Connection error:", error);
    if (
      error.message === "Authentication required" ||
      error.message === "Invalid token"
    ) {
      console.log("[Slide] Authentication failed, disconnecting");
      disconnectSlideSocket();
    }
  });

  slideSocket.on("disconnect", () => {
    console.log("[Slide] Disconnected from server");
  });

  // Game events
  slideSocket.on("game_state", (data) => {
    console.log("[Slide] Game state:", data);
    if (onGameStateHandler) onGameStateHandler(data);
  });

  slideSocket.on("time_update", (data) => {
    if (onTimeUpdateHandler) onTimeUpdateHandler(data);
  });

  slideSocket.on("round_result", (data) => {
    console.log("[Slide] Round result:", data);
    if (onRoundResultHandler) onRoundResultHandler(data);
  });

  slideSocket.on("new_round", (data) => {
    console.log("[Slide] New round:", data);
    if (onNewRoundHandler) onNewRoundHandler(data);
  });

  slideSocket.on("bet_placed", (data) => {
    console.log("[Slide] Bet placed:", data);
    if (onBetPlacedHandler) onBetPlacedHandler(data);
  });

  slideSocket.on("auto_bet_started", (data) => {
    console.log("[Slide] Auto bet started:", data);
    if (onAutoBetStartedHandler) onAutoBetStartedHandler(data);
  });

  slideSocket.on("auto_bet_updated", (data) => {
    console.log("[Slide] Auto bet updated:", data);
    if (onAutoBetUpdatedHandler) onAutoBetUpdatedHandler(data);
  });

  slideSocket.on("auto_bet_complete", () => {
    console.log("[Slide] Auto bet complete");
    if (onAutoBetCompleteHandler) onAutoBetCompleteHandler();
  });

  slideSocket.on("error", (data) => {
    console.error("[Slide] Error:", data);
    if (onErrorHandler) onErrorHandler(data);
  });

  slideSocket.on("bets_updated", (data) => {
    if (onBetsUpdatedHandler) onBetsUpdatedHandler(data);
  });

  // Personal settlement for our bet in the round (win credited / loss kept).
  slideSocket.on("bet_result", (data) => {
    console.log("[Slide] Bet result:", data);
    if (onBetResultHandler) onBetResultHandler(data);
  });
};

export const getSlideSocket = () => {
  return slideSocket;
};

export const disconnectSlideSocket = () => {
  if (slideSocket) {
    slideSocket.disconnect();
    slideSocket = null;
  }
};

// Event handler setters
export const onGameState = (handler) => {
  onGameStateHandler = handler;
};

export const onTimeUpdate = (handler) => {
  onTimeUpdateHandler = handler;
};

export const onRoundResult = (handler) => {
  onRoundResultHandler = handler;
};

export const onNewRound = (handler) => {
  onNewRoundHandler = handler;
};

export const onBetPlaced = (handler) => {
  onBetPlacedHandler = handler;
};

export const onAutoBetStarted = (handler) => {
  onAutoBetStartedHandler = handler;
};

export const onAutoBetUpdated = (handler) => {
  onAutoBetUpdatedHandler = handler;
};

export const onAutoBetComplete = (handler) => {
  onAutoBetCompleteHandler = handler;
};

export const onError = (handler) => {
  onErrorHandler = handler;
};

export const onBetsUpdated = (handler) => {
  onBetsUpdatedHandler = handler;
};

export const onBetResult = (handler) => {
  onBetResultHandler = handler;
};

// Game actions (bets default to the demo wallet unless a walletType is given)
export const placeBet = (betData) => {
  if (slideSocket) {
    slideSocket.emit("place_bet", { walletType: "demo", ...betData });
  }
};

export const placeAutoBet = (autoBetData) => {
  if (slideSocket) {
    slideSocket.emit("place_auto_bet", { walletType: "demo", ...autoBetData });
  }
};

// Cleanup all event handlers
export const removeAllListeners = () => {
  onGameStateHandler = null;
  onTimeUpdateHandler = null;
  onRoundResultHandler = null;
  onNewRoundHandler = null;
  onBetPlacedHandler = null;
  onAutoBetStartedHandler = null;
  onAutoBetUpdatedHandler = null;
  onAutoBetCompleteHandler = null;
  onErrorHandler = null;
  onBetsUpdatedHandler = null;
  onBetResultHandler = null;
};
