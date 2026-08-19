/* eslint-disable */
import { useEffect, useRef, useState } from "react";
import clouds from "../../../assets/Balloon/clouds.png";
import balloon from "../../../assets/Balloon/balloon.png";
import "../../../styles/Balloon.css";
import Background from "./Background";
import {
  disconnectParachuteSocket,
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
}) => {
  const [isCrashed, setIsCrashed] = useState(false);
  const [currentBetCount, setCurrentBetCount] = useState(0);
  const gameIntervalRef = useRef(null);
  const speed = 100;
  const cloudCount = 1000;
  const [mult, setMult] = useState(18);

  // Attach wallet settlement listeners once per socket instance.
  const attachWalletHandlers = () => {
    const parachuteSocket = getParachuteSocket();
    if (!parachuteSocket || parachuteSocket.__walletHandlersBound) return;
    parachuteSocket.__walletHandlersBound = true;

    parachuteSocket.on("game_started", () => {
      // Stake debited server-side; refresh the balance readout.
      requestWalletRefresh();
    });

    parachuteSocket.on("checkout_success", ({ winAmount, multiplier }) => {
      toast.success(
        `Cashed out at ${Number(multiplier).toFixed(2)}x for ${Number(
          winAmount
        ).toFixed(2)}`
      );
      requestWalletRefresh();
    });

    parachuteSocket.on("game_crashed", () => {
      // Bust: the stake stays debited, nothing was credited.
      requestWalletRefresh();
    });

    parachuteSocket.on("error", ({ message }) => {
      console.error("Parachute game error:", message);
      requestWalletRefresh();

      // The server round can crash on its own before the client round does;
      // the follow-up crash/checkout emits then find no active game. Money
      // already settled correctly (the stake stands), so stay quiet.
      if (message === "No active game found") return;

      toast.error(message);

      // A rejected bet (e.g. insufficient balance) never started a server
      // round: stop the local round so the player can bet again.
      if (
        message === "Insufficient balance" ||
        message === "Invalid bet amount" ||
        message === "Game already in progress"
      ) {
        stopGame();
      }
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      attachWalletHandlers();
    }

    return () => {
      const parachuteSocket = getParachuteSocket();
      if (parachuteSocket) {
        parachuteSocket.off("error");
      }
      disconnectParachuteSocket();
    };
  }, []);

  useEffect(() => {
    if (bettingStarted) {
      const parachuteSocket = getParachuteSocket();
      if (parachuteSocket) {
        attachWalletHandlers();
        // Commit the stake for this round exactly once (demo wallet); the
        // server debits it and starts its round.
        addParachuteGame(parseFloat(bet), difficulty, "demo");
        console.log("Emitted add_game event");
      } else {
        console.error("Parachute socket not initialized");
        toast.error("Failed to join game: Socket not connected");
      }
    }
  }, [bettingStarted]);

  useEffect(() => {
    setMult(difficulty === "low" ? 24 : difficulty === "medium" ? 18 : 12);
  }, [difficulty]);

  const stopGame = () => {
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    setBettingStarted(false);
  };

  const runGame = () => {
    if (pause || isCrashed || !bettingStarted) return;

    let localTime = 0;
    gameIntervalRef.current = setInterval(() => {
      localTime += 0.1;
      const newValue = Math.exp(localTime / mult);
      setValue(newValue);

      if (startAutoBet && newValue >= autoMultipyTarget) {
        // Auto cashout hit the target: settle the round server-side so the
        // payout (stake x multiplier) is credited exactly once.
        checkoutParachute();
        stopGame();
        setPause(true);
        setCheckout(true);
        return;
      }

      let rand = Math.random();
      if (rand < 0.01) {
        const parachuteSocket = getParachuteSocket();
        if (parachuteSocket) {
          parachuteSocket.emit("crash", { value: newValue });
          console.log("Emitted crash event");
        } else {
          console.error("Parachute socket not initialized");
          alert("Failed to join game: Socket not connected");
        }

        setIsCrashed(true);
        stopGame();
        setValue(1);
        setCheckout(false);
        setTimeout(() => setIsCrashed(false), 2000);
      }
    }, speed);
  };

  const resetGame = () => {
    stopGame();
    setValue(1);
    setIsCrashed(false);
    setBettingStarted(false);
    setCheckout(false);
    setPause(false);
  };

  useEffect(() => {
    if (pause) {
      setIsCrashed(true);
      stopGame();
      setTimeout(() => resetGame(), 2000);
    }
  }, [pause, value, setIsCrashed]);

  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    if (bettingStarted) {
      toast.error("Game Intterupted");
    }

    if (!user) {
      setBettingStarted(false);
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
        if (currentBetCount > 0 && !bettingStarted && !pause && !isCrashed) {
          performAutoBet();
        } else if (currentBetCount >= nbets || pause || isCrashed) {
          clearInterval(interval);
        }
      }, 1000 + speed);

      return () => clearInterval(interval);
    }
  }, [
    startAutoBet,
    nbets,
    currentBetCount,
    setStartAutoBet,
    bettingStarted,
    pause,
    isCrashed,
  ]);

  useEffect(() => {
    if (bettingStarted) {
      runGame();
    }
  }, [bettingStarted]);

  return (
    <div className="relative w-full h-full bg-primary overflow-hidden max-lg:min-h-[500px]">
      {/* Background */}
      <div
        className={`absolute bottom-0 left-0 overflow-hidden ${
          bettingStarted || isCrashed || pause ? "moving-up" : ""
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
        className={`absolute flex items-center justify-center w-1/2 h-1/2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isCrashed ? "animate-balloon" : ""
        }`}
      >
        <img src={balloon} className="h-full" alt="balloon" />
      </div>

      {/* Game Value Display */}
      <h1
        className={`absolute px-10 aspect-square flex items-center justify-center rounded-full font-bold top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 ${
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
