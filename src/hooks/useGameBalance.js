import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import apiService from "../config/api";
import {
  getActiveWalletType,
  onWalletModeChange,
} from "../utils/activeWallet";
import { onWalletRefresh } from "../utils/walletEvents";

export const useActiveWalletType = () => {
  const [walletType, setWalletType] = useState(getActiveWalletType);

  useEffect(() => {
    return onWalletModeChange(() => setWalletType(getActiveWalletType()));
  }, []);

  return walletType;
};

// Live balance for a casino wallet (demo by default). Refetches whenever any
// surface broadcasts a wallet refresh (a placed bet, a settled round, a
// deposit), so every game shows the balance it is actually spending.
export const useGameBalance = (walletType = "demo") => {
  const token = useSelector((state) => state.auth?.token);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!token) {
      setBalance(null);
      return;
    }
    setLoading(true);
    apiService.wallet
      .getAccounts()
      .then((res) => {
        const accounts = res.data?.accounts || [];
        const account = accounts.find((a) => a.walletType === walletType);
        setBalance(account ? Number(account.availableBalance) : 0);
      })
      .catch(() => setBalance(null))
      .finally(() => setLoading(false));
  }, [token, walletType]);

  useEffect(() => {
    refresh();
    return onWalletRefresh(refresh);
  }, [refresh]);

  return { balance, loading, refresh };
};
