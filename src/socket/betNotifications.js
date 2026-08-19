import { toast } from "react-toastify";
import { getSocket } from "./socket";
import { requestWalletRefresh } from "../utils/walletEvents";

const settlementListeners = new Set();

// socket.io reuses one instance across reconnects, so attachment is tracked
// per instance — a fresh initializeSocket() gets a fresh attachment.
const attachedSockets = new WeakSet();

export const onBetSettled = (callback) => {
  settlementListeners.add(callback);
  return () => settlementListeners.delete(callback);
};

// Registered once after the default socket connects; the backend pushes
// bet_settled to the user's private room on settlement.
export const attachBetSettledListener = () => {
  const socket = getSocket();
  if (!socket || attachedSockets.has(socket)) return;
  attachedSockets.add(socket);

  socket.on("bet_settled", (payload = {}) => {
    const { result, payout, selectionName, eventName } = payload;

    if (result === "won") {
      toast.success(
        `Bet won: ${selectionName || "your selection"} paid ₹${Number(
          payout || 0
        ).toFixed(2)}`
      );
    } else if (result === "void") {
      toast.info(
        `Bet voided${eventName ? ` on ${eventName}` : ""} — stake refunded`
      );
    } else if (result === "lost") {
      toast.info(`Bet settled: ${selectionName || "your selection"} lost`);
    }

    requestWalletRefresh();
    settlementListeners.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error("Bet settled listener failed:", error);
      }
    });
  });
};
