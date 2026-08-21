import { io } from "socket.io-client";
import { SOCKET_URL } from "../../config/backendUrls";

let scratchSocket = null;
let isConnecting = false;

export const initializeScratchSocket = (token) => {
  if (!token) {
    console.error("No token provided for socket initialization");
    return null;
  }

  if (scratchSocket?.connected) {
    console.log("Socket already connected, reusing connection");
    return scratchSocket;
  }

  if (isConnecting) {
    console.log("Socket connection in progress, waiting...");
    return null;
  }

  try {
    isConnecting = true;
    console.log("Initializing scratch socket...");

    if (scratchSocket) {
      console.log("Cleaning up existing socket connection");
      scratchSocket.disconnect();
      scratchSocket = null;
    }

    const socketUrl = `${SOCKET_URL}/scratch`;
    console.log("Connecting to socket URL:", socketUrl);

    scratchSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    scratchSocket.on("connect", () => {
      console.log("✅ Connected to Scratch socket with ID:", scratchSocket.id);
      isConnecting = false;
    });

    scratchSocket.on("connect_error", (error) => {
      console.error("❌ Scratch socket connection error:", error);
      isConnecting = false;
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!scratchSocket?.connected) {
          console.log("Attempting to reconnect...");
          initializeScratchSocket(token);
        }
      }, 2000);
    });

    scratchSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        console.log("Server disconnected, attempting to reconnect...");
        setTimeout(() => {
          if (!scratchSocket?.connected) {
            initializeScratchSocket(token);
          }
        }, 1000);
      }
    });

    return scratchSocket;
  } catch (error) {
    console.error("Error initializing socket:", error);
    isConnecting = false;
    return null;
  }
};

export const getScratchSocket = () => {
  if (!scratchSocket) {
    console.log("Socket not initialized, attempting to initialize...");
    const token = localStorage.getItem("token");
    if (token) {
      return initializeScratchSocket(token);
    }
    console.log("No token found, cannot initialize socket");
    return null;
  }
  return scratchSocket;
};

export const disconnectScratchSocket = () => {
  if (scratchSocket) {
    scratchSocket.disconnect();
    scratchSocket = null;
  }
};

// Game event handlers
export const getActiveGame = (callback) => {
  if (scratchSocket) {
    scratchSocket.emit("get_active_game");
    scratchSocket.once("active_game", callback);
  }
};

export const startGame = (
  betAmount,
  isAutoBet = false,
  numberOfBets = 0,
  callback,
  walletType = "demo"
) => {
  if (scratchSocket) {
    scratchSocket.emit("start_game", {
      betAmount: parseFloat(betAmount),
      isAutoBet,
      numberOfBets: isAutoBet ? parseInt(numberOfBets) : 0,
      walletType,
    });
    if (callback) {
      scratchSocket.once("game_started", callback);
    }
  }
};

export const revealBox = (gameId, boxIndex, callback) => {
  if (scratchSocket) {
    scratchSocket.emit("reveal_box", { gameId, boxIndex });
    if (callback) {
      scratchSocket.once("box_revealed", callback);
    }
  }
};

export const addGame = (callback) => {
  if (scratchSocket) {
    scratchSocket.emit("add_game", {});
    if (callback) {
      scratchSocket.once("game_started", callback);
    }
  }
};

// Event listeners
export const onGameStarted = (callback) => {
  if (scratchSocket) {
    scratchSocket.on("game_started", callback);
  }
};

export const onBoxRevealed = (callback) => {
  if (scratchSocket) {
    scratchSocket.on("box_revealed", callback);
  }
};

export const onGameCompleted = (callback) => {
  if (scratchSocket) {
    scratchSocket.on("game_completed", callback);
  }
};

export const onError = (callback) => {
  if (scratchSocket) {
    scratchSocket.on("error", callback);
  }
};

// Remove event listeners
export const removeGameStartedListener = () => {
  if (scratchSocket) {
    scratchSocket.off("game_started");
  }
};

export const removeBoxRevealedListener = () => {
  if (scratchSocket) {
    scratchSocket.off("box_revealed");
  }
};

export const removeGameCompletedListener = () => {
  if (scratchSocket) {
    scratchSocket.off("game_completed");
  }
};

export const removeErrorListener = () => {
  if (scratchSocket) {
    scratchSocket.off("error");
  }
};

// Remove all game-related listeners
export const removeAllGameListeners = () => {
  if (scratchSocket) {
    removeGameStartedListener();
    removeBoxRevealedListener();
    removeGameCompletedListener();
    removeErrorListener();
  }
};

// Add a function to check socket connection status
export const checkSocketConnection = () => {
  const socket = getScratchSocket();
  return {
    connected: socket?.connected || false,
    connecting: isConnecting,
    socketId: socket?.id,
    hasSocket: !!socket,
  };
};
