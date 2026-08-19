import React, { useEffect, useState } from "react";
import ResponsiveSegmentedCircles from "./Rod";

import {
  disconnectTwistSocket,
  getTwistSocket,
  placeBet,
} from "../../../socket/games/twist";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { toast } from "react-toastify";

const BonusWheel = ({
  bet,
  betTrigger,
  betInfo,
  setbetInfo,
  handleCheckout,
  green,
  setgreen,
  orange,
  setorange,
  purple,
  setpurple,
  loading,
}) => {
  const diamonds = ["orange", "green", "purple", "skull", "null"];

  const [CurrentDiamond, setCurrentDiamond] = useState("purple");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const twistSocket = getTwistSocket();

      if (twistSocket) {
        twistSocket.on("error", ({ message }) => {
          console.error("Join game error:", message);
          toast.error(`Error joining game: ${message}`);
          // A rejected bet (e.g. insufficient balance) left the wallet
          // untouched; resync the readout in case it drifted.
          requestWalletRefresh();
        });

        twistSocket.on("bet_result", () => {
          // Reflect the stake debit in the in-game balance readout.
          requestWalletRefresh();
        });
      }
    }

    return () => {
      const twistSocket = getTwistSocket();
      if (twistSocket) {
        twistSocket.off("error");
        twistSocket.off("bet_result");
      }
      disconnectTwistSocket();
    };
  }, []);

  useEffect(() => {
    if (betTrigger) {
      const twistSocket = getTwistSocket();
      if (twistSocket) {
        twistSocket.emit("add_game", {});
        console.log("Emitted add_game event");
        // Debit the spin's stake from the demo wallet.
        placeBet(parseFloat(bet), "demo");
      } else {
        console.error("Twist socket not initialized");
        alert("Failed to join game: Socket not connected");
      }
    }
  }, [betTrigger]);

  useEffect(() => {
    if (betTrigger) {
      const timeout = setTimeout(() => {
        const randomDiamond =
          diamonds[Math.floor(Math.random() * diamonds.length)];
        if (randomDiamond === "orange") {
          setorange((prev) => prev + 1);
          setbetInfo((prev) => [
            ...prev,
            {
              item: randomDiamond,
              index: orange + 1, // Use the updated value of `orange` after increment
            },
          ]);
        } else if (randomDiamond === "green") {
          setgreen((prev) => prev + 1);
          setbetInfo((prev) => [
            ...prev,
            {
              item: randomDiamond,
              index: green + 1, // Use updated `green`
            },
          ]);
        } else if (randomDiamond === "purple") {
          setpurple((prev) => prev + 1);
          setbetInfo((prev) => [
            ...prev,
            {
              item: randomDiamond,
              index: purple + 1,
            },
          ]);
        } else if (randomDiamond === "skull") {
          setorange((prev) => (prev > 0 ? prev - 1 : prev));
          setpurple((prev) => (prev > 0 ? prev - 1 : prev));
          setgreen((prev) => (prev > 0 ? prev - 1 : prev));

          setbetInfo((prev) => [
            ...prev,
            {
              item: randomDiamond,
              index: "skull",
            },
          ]);
        } else {
          console.log(randomDiamond);
          setbetInfo((prev) => [
            ...prev,
            {
              item: randomDiamond,
              index: "null",
            },
          ]);
        }

        setCurrentDiamond(randomDiamond);
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [betTrigger, orange, green, purple]);

  return (
    <ResponsiveSegmentedCircles
      green={green}
      orange={orange}
      purple={purple}
      targetIndex={1}
      handleCheckout={handleCheckout}
      setCurrentDiamond={setCurrentDiamond}
      loading={loading}
      CurrentDiamond={CurrentDiamond}
      betTrigger={betTrigger}
    />
  );
};

export default BonusWheel;
