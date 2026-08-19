import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaBars,
  FaChevronDown,
  FaCoins,
  FaGift,
  FaLifeRing,
  FaSearch,
  FaSignOutAlt,
  FaUser,
  FaWallet,
} from "react-icons/fa";
import logo from "../../assets/logo.svg";
import apiService from "../../config/api";
import LoadingSpinner from "../LoadingSpinner";
import SetupWalletModal from "../Modals/SetupWalletModal";
import WalletActionsModal from "../Modals/WalletActionsModal";
import {
  isNavigationActive,
  primaryNavigation,
} from "../../config/platformNavigation";
import { logout } from "../../store/slices/authSlice";

const accountLinks = [
  { label: "Wallet", path: "/wallet", icon: FaWallet },
  { label: "Rewards", path: "/rewards", icon: FaGift },
  { label: "Support", path: "/support", icon: FaLifeRing },
  { label: "My Bets", path: "/casino/my-bets", icon: FaCoins },
  { label: "Settings", path: "/settings", icon: FaUser },
];

const Header = ({ setSideOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const user = useSelector((state) => state.auth?.user);
  const [isProfDropDownOpen, setIsProfDropDownOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showSetupWallet, setShowSetupWallet] = useState(false);
  const [showWalletActions, setShowWalletActions] = useState(false);

  const openModal = (tab) => {
    navigate({
      pathname: location.pathname,
      search: `?tab=${tab}`,
    });
  };

  useEffect(() => {
    if (user) {
      setLoadingBalance(true);
      apiService
        .get("/wallet/balance")
        .then((res) => {
          setBalance(res.data.balance);
          setHasWallet(true);
        })
        .catch(() => {
          setBalance(0);
          setHasWallet(false);
        })
        .finally(() => setLoadingBalance(false));
    } else {
      setLoadingBalance(false);
      setHasWallet(false);
      setBalance(null);
    }
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfDropDownOpen(false);
      }
    };

    if (isProfDropDownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isProfDropDownOpen]);

  const handleWalletClick = () => {
    if (loadingBalance) return;

    if (!hasWallet) {
      setShowSetupWallet(true);
      return;
    }

    setShowWalletActions(true);
  };

  const updateBalance = (newBalance) => {
    setBalance(newBalance);
    setHasWallet(true);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setIsProfDropDownOpen(false);
  };

  return (
    <>
      <div className="border-b border-white/5 bg-[linear-gradient(180deg,_rgba(9,13,11,0.95)_0%,_rgba(9,13,11,0.8)_100%)] px-4 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur md:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 xl:hidden"
              onClick={() => setSideOpen(true)}
            >
              <FaBars />
            </button>
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="Khel Guru logo"
                className="h-[52px] w-[52px] rounded-2xl object-contain"
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

          <nav className="hidden items-center gap-2 xl:flex">
            {primaryNavigation.map((item) => {
              const active = isNavigationActive(item, location.pathname);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-primary text-text-inverse"
                      : "bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
              onClick={() => openModal("search")}
            >
              <FaSearch className="text-brand-primary" />
              <span className="hidden md:inline">Search</span>
            </button>

            {user ? (
              <>
                <button
                  onClick={handleWalletClick}
                  className="flex h-11 items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-sm font-bold text-white transition hover:bg-emerald-400/15"
                >
                  <FaWallet className="text-brand-primary" />
                  <span>
                    {loadingBalance ? (
                      <LoadingSpinner size="sm" showText={false} />
                    ) : hasWallet ? (
                      balance.toFixed(2)
                    ) : (
                      "Setup Wallet"
                    )}
                  </span>
                </button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfDropDownOpen((prev) => !prev)}
                    className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
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
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-text-secondary transition hover:bg-white/5 hover:text-white"
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
                        className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
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
                  className="hidden h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 md:block"
                  onClick={() => openModal("login")}
                >
                  Login
                </button>
                <button
                  className="h-11 rounded-2xl bg-brand-primary px-4 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover"
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
      {showWalletActions && (
        <WalletActionsModal
          initialBalance={balance || 0}
          onClose={() => setShowWalletActions(false)}
          onSuccess={updateBalance}
        />
      )}
    </>
  );
};

export default Header;
