/* eslint-disable */
import { useEffect, useRef, useState } from "react";
import clouds from "../../../assets/Balloon/clouds.png";
import balloon from "../../../assets/Balloon/balloon.png";
import "../../../styles/Balloon.css";
import Background from "./Background";
import {
  getParachuteSocket,
  addParachuteGame,
  checkoutParachute,
} from "../../../socket/games/parachute";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";

const Game = ({
  setCheckout,
  bettingStarted,
  setBettingStarted,
  bet,
  value,
  setValue,
  pause,
  setPause,
  difficulty,
  autoMultipyTarget,
  startAutoBet,
  setStartAutoBet,
  nbets,
  onRoundCrash,
  onRoundSettle,
  onRoundReady,
  onFairness,
  roundLocked,
}) => {
  const [isCrashed, setIsCrashed] = useState(false);
  const [roundActive, setRoundActive] = useState(false);
  const [currentBetCount, setCurrentBetCount] = useState(0);
  const cloudCount = 1000;
  const autoCashoutFired = useRef(false);
  const startAutoBetRef = useRef(startAutoBet);
  const autoTargetRef = useRef(autoMultipyTarget);
  const roundHandlersRef = useRef(null);
  const lastStateAtRef = useRef(0);
  const valueRef = useRef(value);
  const crashHandledRef = useRef(false);
  const onRoundCrashRef = useRef(onRoundCrash);
  const onRoundSettleRef = useRef(onRoundSettle);
  const onRoundReadyRef = useRef(onRoundReady);
  const onFairnessRef = useRef(onFairness);

  useEffect(() => {
    startAutoBetRef.current = startAutoBet;
  }, [startAutoBet]);

  useEffect(() => {
    autoTargetRef.current = autoMultipyTarget;
  }, [autoMultipyTarget]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onRoundCrashRef.current = onRoundCrash;
  }, [onRoundCrash]);

  useEffect(() => {
    onRoundSettleRef.current = onRoundSettle;
  }, [onRoundSettle]);

  useEffect(() => {
    onRoundReadyRef.current = onRoundReady;
  }, [onRoundReady]);

  useEffect(() => {
    onFairnessRef.current = onFairness;
  }, [onFairness]);

  const applyFairness = (payload = {}, observed) => {
    const fairness = payload.fairness || payload;
    if (!fairness?.serverSeedHash) return;
    const crashPoint =
      observed ??
      payload.crashPoint ??
      (fairness.observed != null ? fairness.observed : null);
    onFairnessRef.current?.({
      clientSeed: fairness.clientSeed,
      serverSeedHash: fairness.serverSeedHash,
      nonce: fairness.nonce,
      difficulty: fairness.difficulty || payload.difficulty,
      observed: crashPoint,
      observedLabel: crashPoint != null ? "Crash point" : undefined,
      observedDisplay:
        crashPoint != null ? `${Number(crashPoint).toFixed(2)}x` : undefined,
    });
  };

  const handleRoundCrash = (multiplier) => {
    if (crashHandledRef.current) return;
    crashHandledRef.current = true;
    onRoundSettleRef.current?.();

    const crashAt = Number(multiplier);
    if (Number.isFinite(crashAt)) {
      setValue(crashAt);
      onRoundCrashRef.current?.(crashAt);
    }
    setRoundActive(false);
    setIsCrashed(true);
    stopGame();
    setCheckout(false);
    requestWalletRefresh();
    setTimeout(() => resetGame(), 2000);
  };

  const stopGame = () => {
    setBettingStarted(false);
    autoCashoutFired.current = false;
  };

  const resetGame = () => {
    stopGame();
    setValue(1);
    setIsCrashed(false);
    setRoundActive(false);
    setCheckout(false);
    setPause(false);
    crashHandledRef.current = false;
    onRoundReadyRef.current?.();
  };

  const attachRoundHandlers = () => {
    const parachuteSocket = getParachuteSocket();
    if (!parachuteSocket || parachuteSocket.__roundHandlersBound) return;

    const onGameStarted = (data) => {
      autoCashoutFired.current = false;
      crashHandledRef.current = false;
      lastStateAtRef.current = Date.now();
      setRoundActive(true);
      setValue(1);
      setIsCrashed(false);
      setPause(false);
      requestWalletRefresh();
      applyFairness(data);
    };

    const onGameState = ({ multiplier, isCrashed: crashed, hasCheckedOut }) => {
      lastStateAtRef.current = Date.now();

      if (hasCheckedOut) {
        setRoundActive(false);
        return;
      }

      if (Number.isFinite(Number(multiplier))) {
        const next = Number(multiplier);
        setValue(next);

        const target = parseFloat(autoTargetRef.current);
        if (
          startAutoBetRef.current &&
          !autoCashoutFired.current &&
          Number.isFinite(target) &&
          next >= target
        ) {
          autoCashoutFired.current = true;
          onRoundSettleRef.current?.();
          checkoutParachute();
          setPause(true);
          setCheckout(true);
          stopGame();
        }
      }

      if (crashed) {
        handleRoundCrash(multiplier);
      }
    };

    const onCheckoutSuccess = (payload) => {
      const { winAmount, multiplier } = payload;
      crashHandledRef.current = true;
      setRoundActive(false);
      setValue(Number(multiplier));
      setPause(true);
      setCheckout(true);
      stopGame();
      applyFairness(payload, payload.crashPoint);

      toast.success(
        `Cashed out at ${Number(multiplier).toFixed(2)}x for ${Number(
          winAmount
        ).toFixed(2)}`
      );
      requestWalletRefresh();
    };

    const onGameCrashed = (payload) => {
      applyFairness(payload, payload.crashPoint ?? payload.multiplier);
      handleRoundCrash(payload.multiplier);
    };

    const onError = ({ message }) => {
      console.error("Parachute game error:", message);
      requestWalletRefresh();

      if (message === "No active game found") return;

      toast.error(message);

      if (
        message === "Insufficient balance" ||
        message === "Invalid bet amount" ||
        message === "Game already in progress"
      ) {
        resetGame();
      }
    };

    roundHandlersRef.current = {
      game_started: onGameStarted,
      game_state: onGameState,
      checkout_success: onCheckoutSuccess,
      game_crashed: onGameCrashed,
      error: onError,
    };

    Object.entries(roundHandlersRef.current).forEach(([event, handler]) => {
      parachuteSocket.on(event, handler);
    });
    parachuteSocket.__roundHandlersBound = true;
  };

  const detachRoundHandlers = () => {
    const parachuteSocket = getParachuteSocket();
    const handlers = roundHandlersRef.current;
    if (!parachuteSocket || !handlers) return;

    Object.entries(handlers).forEach(([event, handler]) => {
      parachuteSocket.off(event, handler);
    });
    roundHandlersRef.current = null;
    parachuteSocket.__roundHandlersBound = false;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      attachRoundHandlers();
    }

    return () => {
      detachRoundHandlers();
    };
  }, []);

  useEffect(() => {
    if (bettingStarted && !roundLocked) {
      setRoundActive(true);
      crashHandledRef.current = false;
      lastStateAtRef.current = Date.now();
      const parachuteSocket = getParachuteSocket();
      if (parachuteSocket) {
        attachRoundHandlers();
        addParachuteGame(parseFloat(bet), difficulty, "demo");
      } else {
        console.error("Parachute socket not initialized");
        toast.error("Failed to join game: Socket not connected");
        setBettingStarted(false);
      }
    }
  }, [bettingStarted, roundLocked]);

  useEffect(() => {
    if (!roundActive || pause || isCrashed) return undefined;

    const watchdog = setInterval(() => {
      if (Date.now() - lastStateAtRef.current > 450) {
        handleRoundCrash(valueRef.current);
      }
    }, 150);

    return () => clearInterval(watchdog);
  }, [roundActive, pause, isCrashed]);

  useEffect(() => {
    if (pause && !crashHandledRef.current) {
      setIsCrashed(true);
      stopGame();
      setTimeout(() => resetGame(), 2000);
    }
  }, [pause]);

  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    if (!user) {
      resetGame();
    }
  }, [user]);

  useEffect(() => {
    if (startAutoBet && nbets > 0) {
      const performAutoBet = () => {
        if (currentBetCount < nbets) {
          setBettingStarted(true);
          setCurrentBetCount((prev) => prev + 1);
        } else {
          setStartAutoBet(false);
          setCurrentBetCount(0);
        }
      };

      if (currentBetCount === 0 && !bettingStarted) {
        performAutoBet();
      }

      const interval = setInterval(() => {
        if (
          currentBetCount > 0 &&
          !bettingStarted &&
          !roundLocked &&
          !pause &&
          !isCrashed
        ) {
          performAutoBet();
        } else if (currentBetCount >= nbets || pause || isCrashed || roundLocked) {
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [
    startAutoBet,
    nbets,
    currentBetCount,
    setStartAutoBet,
    bettingStarted,
    roundLocked,
    pause,
    isCrashed,
  ]);

  return (
    <div className="relative z-0 h-full w-full overflow-hidden bg-primary max-lg:min-h-[260px] lg:min-h-0">
      {/* Background */}
      <div
        className={`absolute bottom-0 left-0 overflow-hidden ${
          roundActive || isCrashed || pause ? "moving-up" : ""
        }`}
      >
        <div>
          <div className="w-full bg-blue-600">
            {Array.from({ length: cloudCount }).map((_, index) => (
              <img key={index} src={clouds} className="w-full" alt="clouds" />
            ))}
          </div>
          <div className="w-full relative bg-gradient-to-t from-[#d08e80] to-blue-600">
            {[...Array(3)].map((_, idx) => (
              <img key={idx} src={clouds} className="w-full" alt="clouds" />
            ))}
          </div>
        </div>
        <Background />
      </div>

      {/* Balloon */}
      <div
        className={`absolute flex items-center justify-center w-[65%] h-[65%] max-lg:w-[55%] max-lg:h-[55%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isCrashed ? "animate-balloon" : ""
        }`}
      >
        <img src={balloon} className="h-full" alt="balloon" />
      </div>

      {/* Game Value Display */}
      <h1
        className={`absolute flex aspect-square items-center justify-center rounded-full px-10 font-bold top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 max-lg:top-[46%] max-lg:px-6 max-lg:text-xl ${
          isCrashed ? "zoom-text" : ""
        }`}
      >
        {isCrashed
          ? pause
            ? `${value.toFixed(2)}x`
            : "Crashed"
          : `${value.toFixed(2)}x`}
      </h1>
    </div>
  );
};

export default Game;
