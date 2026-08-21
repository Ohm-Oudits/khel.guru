const WALLET_MODE_KEY = "kg.wallet.mode";
const listeners = new Set();

export const readWalletMode = () => {
  try {
    return localStorage.getItem(WALLET_MODE_KEY) === "real" ? "real" : "demo";
  } catch {
    return "demo";
  }
};

export const getActiveWalletType = () =>
  readWalletMode() === "real" ? "cash" : "demo";

export const setWalletMode = (mode) => {
  const next = mode === "real" ? "real" : "demo";
  try {
    localStorage.setItem(WALLET_MODE_KEY, next);
  } catch {
    // Ignore storage failures in unsupported environments.
  }
  listeners.forEach((listener) => listener(next));
};

export const onWalletModeChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
