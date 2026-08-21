import React, { useEffect, useRef, useState } from "react";
import ResponsiveSegmentedCircles from "./Rod";

import { getTwistSocket, placeBet } from "../../../socket/games/twist";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { toast } from "react-toastify";
import { saveTwistRoundRecord } from "../../../utils/twistRoundHistory";
import { getActiveWalletType } from "../../../utils/activeWallet";

const BonusWheel = ({
  bet,
  betTrigger,
  setbetInfo,
  onSpinComplete,
  onSpinFailed,
  onFairness,
  setgreen,
  setorange,
  setpurple,
  loading,
  green,
  orange,
  purple,
}) => {
  const [spinOutcome, setSpinOutcome] = useState(null);
  const pendingResultRef = useRef(null);
  const waitingForResultRef = useRef(false);

  const applyServerResult = (result) => {
    const next = result.progress;
    setorange(next.orange);
    setgreen(next.green);
    setpurple(next.purple);
    setbetInfo((prev) => [
      ...prev,
      {
        item: result.outcome,
        index:
          result.outcome === "skull" || result.outcome === "null"
            ? result.outcome
            : "hit",
      },
    ]);
    saveTwistRoundRecord({
      nonce: result.nonce,
      clientSeed: result.clientSeed,
      serverSeedHash: result.serverSeedHash,
      outcome: result.outcome,
      float: result.float,
      betAmount: result.betAmount,
      progress: next,
    });
    onFairness?.({
      nonce: result.nonce,
      clientSeed: result.clientSeed,
      serverSeedHash: result.serverSeedHash,
      outcome: result.outcome,
    });
    onSpinComplete?.(next);
  };

  useEffect(() => {
    if (!betTrigger) return undefined;

    const twistSocket = getTwistSocket();
    if (!twistSocket) {
      toast.error("Twist socket not initialized");
      onSpinFailed?.();
      return undefined;
    }

    waitingForResultRef.current = true;

    const onError = () => {
      requestWalletRefresh();
      if (!waitingForResultRef.current) return;
      waitingForResultRef.current = false;
      pendingResultRef.current = null;
      setSpinOutcome(null);
      onSpinFailed?.();
    };

    const onBetResult = (result) => {
      waitingForResultRef.current = false;
      requestWalletRefresh();
      pendingResultRef.current = result;
      setSpinOutcome(result);
    };

    twistSocket.on("error", onError);
    twistSocket.on("bet_result", onBetResult);
    twistSocket.emit("add_game", {});
    placeBet(parseFloat(bet), getActiveWalletType());

    return () => {
      twistSocket.off("error", onError);
      twistSocket.off("bet_result", onBetResult);
    };
  }, [betTrigger, bet, onSpinFailed]);

  return (
    <ResponsiveSegmentedCircles
      green={green}
      orange={orange}
      purple={purple}
      loading={loading}
      CurrentDiamond={spinOutcome?.outcome || "purple"}
      betTrigger={Boolean(spinOutcome)}
      onSpinEnd={() => {
        const result = pendingResultRef.current;
        pendingResultRef.current = null;
        setSpinOutcome(null);
        if (result) {
          applyServerResult(result);
        } else {
          onSpinFailed?.();
        }
      }}
    />
  );
};

export default BonusWheel;
