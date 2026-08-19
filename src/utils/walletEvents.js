// Tiny pub/sub so any surface (bet slip, cashier, settlement toasts) can ask
// balance displays to refetch without threading props through the app.
const listeners = new Set();

export const onWalletRefresh = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const requestWalletRefresh = () => {
  listeners.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error("Wallet refresh listener failed:", error);
    }
  });
};
