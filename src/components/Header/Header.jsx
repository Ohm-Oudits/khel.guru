import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaChevronDown,
  FaCoins,
  FaSearch,
  FaSignOutAlt,
  FaUser,
  FaWallet,
} from "react-icons/fa";
import logo from "../../assets/logo.svg";
import apiService from "../../config/api";
import { onWalletRefresh } from "../../utils/walletEvents";
import { readWalletMode, setWalletMode as persistWalletMode } from "../../utils/activeWallet";
import LoadingSpinner from "../LoadingSpinner";
import SetupWalletModal from "../Modals/SetupWalletModal";
import { logout } from "../../store/slices/authSlice";

const accountLinks = [
  { label: "Wallet", path: "/wallet", icon: FaWallet },
  { label: "My Bets", path: "/casino/my-bets", icon: FaCoins },
  { label: "Settings", path: "/settings", icon: FaUser },
];

const headerButtonClass =
  "inline-flex h-[35px] min-h-[35px] max-h-[35px] shrink-0 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs leading-none max-lg:rounded-xl lg:h-12 lg:min-h-12 lg:max-h-12 lg:gap-2 lg:px-4 lg:text-sm lg:rounded-2xl";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const walletMenuRef = useRef(null);

  const user = useSelector((state) => state.auth?.user);
  const [isProfDropDownOpen, setIsProfDropDownOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [walletMode, setWalletMode] = useState(readWalletMode);
  const [cashBalance, setCashBalance] = useState(0);
  const [demoBalance, setDemoBalance] = useState(0);
  const [hasWallet, setHasWallet] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showSetupWallet, setShowSetupWallet] = useState(false);

  const openModal = (tab) => {
    navigate({
      pathname: location.pathname,
      search: `?tab=${tab}`,
    });
  };

  useEffect(() => {
    const loadBalance = () => {
      if (!user) {
        setLoadingBalance(false);
        setHasWallet(false);
        setCashBalance(0);
        setDemoBalance(0);
        return;
      }
      setLoadingBalance(true);
      apiService
        .get("/wallet/balance")
        .then((res) => {
          setCashBalance(Number(res.data.cashBalance ?? res.data.balance ?? 0));
          setDemoBalance(Number(res.data.demoBalance ?? 0));
          setHasWallet(true);
        })
        .catch(() => {
          setCashBalance(0);
          setDemoBalance(0);
          setHasWallet(false);
        })
        .finally(() => setLoadingBalance(false));
    };

    loadBalance();
    // Bets, deposits, and settlements broadcast a refresh request.
    return onWalletRefresh(loadBalance);
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfDropDownOpen(false);
      }
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target)) {
        setIsWalletMenuOpen(false);
      }
    };

    if (isProfDropDownOpen || isWalletMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isProfDropDownOpen, isWalletMenuOpen]);

  const handleWalletClick = () => {
    if (loadingBalance) return;

    if (!hasWallet) {
      setShowSetupWallet(true);
      return;
    }

    setIsProfDropDownOpen(false);
    setIsWalletMenuOpen((open) => !open);
  };

  const selectWalletMode = (mode) => {
    setWalletMode(mode);
    persistWalletMode(mode);
  };

  const updateBalance = (newBalance) => {
    if (walletMode === "real") {
      setCashBalance(newBalance);
    } else {
      setDemoBalance(newBalance);
    }
    setHasWallet(true);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setIsProfDropDownOpen(false);
    setIsWalletMenuOpen(false);
  };

  const displayBalance = walletMode === "real" ? cashBalance : demoBalance;
  const walletOptions = [
    { mode: "real", label: "Real", balance: cashBalance },
    { mode: "demo", label: "Demo", balance: demoBalance },
  ];

  return (
    <>
      <div className="border-b border-white/5 bg-[linear-gradient(180deg,_rgba(9,13,11,0.95)_0%,_rgba(9,13,11,0.8)_100%)] px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur max-lg:py-2 md:px-6 lg:py-3.5 xl:px-6">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="Khel Guru logo"
                className="h-[43px] w-[43px] rounded-xl object-contain lg:h-[57px] lg:w-[57px] lg:rounded-2xl"
              />
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
                  Khel Guru
                </p>
                <h1 className="text-base font-black text-white">
                  Casino & Sports
                </h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`${headerButtonClass} border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10`}
              onClick={() => openModal("search")}
            >
              <FaSearch className="text-brand-primary" />
              <span className="hidden md:inline">Search</span>
            </button>

            {user ? (
              <>
                <div className="relative" ref={walletMenuRef}>
                  <button
                    onClick={handleWalletClick}
                    className={`${headerButtonClass} border border-emerald-400/20 bg-emerald-400/10 font-bold text-white transition hover:bg-emerald-400/15`}
                  >
                    <FaWallet className="text-brand-primary" />
                    <span>
                      {loadingBalance ? (
                        <LoadingSpinner size="sm" showText={false} />
                      ) : hasWallet ? (
                        Number(displayBalance || 0).toFixed(2)
                      ) : (
                        "Setup Wallet"
                      )}
                    </span>
                  </button>

                  {isWalletMenuOpen && hasWallet ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] w-56 rounded-[24px] border border-white/10 bg-background-secondary p-3 shadow-2xl">
                      <div className="flex rounded-2xl border border-white/10 bg-black/25 p-1">
                        {walletOptions.map((option) => {
                          const selected = walletMode === option.mode;
                          return (
                            <button
                              key={option.mode}
                              type="button"
                              className={`h-9 flex-1 rounded-xl text-sm font-semibold leading-none transition ${
                                selected
                                  ? "bg-brand-primary text-text-inverse"
                                  : "text-text-tertiary hover:text-white"
                              }`}
                              onClick={() => selectWalletMode(option.mode)}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-center text-2xl font-black text-white">
                        {Number(displayBalance || 0).toFixed(2)}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setIsWalletMenuOpen(false);
                      setIsProfDropDownOpen((prev) => !prev);
                    }}
                    className={`${headerButtonClass} border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10`}
                  >
                    <FaUser />
                    <span className="hidden md:inline">
                      {user.username || "Account"}
                    </span>
                    <FaChevronDown className="text-xs text-text-tertiary" />
                  </button>

                  {isProfDropDownOpen && (
                    <div className="absolute right-0 top-[calc(100%+12px)] w-64 rounded-[24px] border border-white/10 bg-background-secondary p-2 shadow-2xl">
                      {accountLinks.map((item) => (
                        <button
                          key={item.label}
                          className="flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold leading-none text-text-secondary transition hover:bg-white/5 hover:text-white"
                          onClick={() => {
                            navigate(item.path);
                            setIsProfDropDownOpen(false);
                          }}
                        >
                          <item.icon className="text-brand-primary" />
                          {item.label}
                        </button>
                      ))}
                      <button
                        className="mt-1 flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold leading-none text-red-300 transition hover:bg-red-500/10"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  className={`${headerButtonClass} bg-brand-primary font-bold text-text-inverse transition hover:bg-interactive-primaryHover md:hidden`}
                  onClick={() => openModal("login")}
                >
                  Login
                </button>
                <button
                  className={`${headerButtonClass} hidden border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10 md:inline-flex`}
                  onClick={() => openModal("login")}
                >
                  Login
                </button>
                <button
                  className={`${headerButtonClass} hidden bg-brand-primary font-bold text-text-inverse transition hover:bg-interactive-primaryHover md:inline-flex`}
                  onClick={() => openModal("register")}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showSetupWallet && (
        <SetupWalletModal
          onClose={() => setShowSetupWallet(false)}
          onSuccess={updateBalance}
        />
      )}
    </>
  );
};

export default Header;
