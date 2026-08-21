import React, { useEffect, useRef, useState } from "react";
import { CircleNotch } from "phosphor-react";
import BinsRow from "./BinsRow";
import { binColorsByRowCount } from "./constant";
import { getPlinkoSocket } from "../../../socket/games/plinko";
import { toast } from "react-toastify";

const Game = ({ bet, rows, risk, engine, width, height, canvasRef }) => {
  const [binColors, setBinColors] = useState(binColorsByRowCount(rows));
  const [isValidBet, setIsValidBet] = useState(true);

  useEffect(() => {
    setBinColors(binColorsByRowCount(rows));
  }, [rows]);

  useEffect(() => {
    const isValid =
      bet !== "" && bet != null && !isNaN(bet) && parseFloat(bet) >= 0;
    setIsValidBet(isValid);

    if (!isValid && bet !== "0.000000") {
      toast.error("Please enter a valid bet amount");
    }
  }, [bet]);

  useEffect(() => {
    const plinkoSocket = getPlinkoSocket();

    if (plinkoSocket) {
      plinkoSocket.on("error", ({ message }) => {
        console.error("Join game error:", message);
        toast.error(`Error joining game: ${message}`);
      });
    }

    const handleGameResult = (event) => {
      const { payout, multiplier } = event.detail;
      const amount = Number(payout) || 0;
      const toastText =
        amount > 0
          ? `${amount.toFixed(2)} · ${multiplier}x`
          : `${multiplier}x`;
      toast.success(toastText);
    };

    const handleGameError = (event) => {
      const { message } = event.detail;
      toast.error(message);
    };

    window.addEventListener("plinko:result", handleGameResult);
    window.addEventListener("plinko:error", handleGameError);

    return () => {
      const plinkoSocket = getPlinkoSocket();
      if (plinkoSocket) {
        plinkoSocket.off("error");
      }

      window.removeEventListener("plinko:result", handleGameResult);
      window.removeEventListener("plinko:error", handleGameError);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      <div
        className="mx-auto flex h-full w-full flex-col items-center justify-center px-2 py-2 lg:px-4 lg:pb-4"
        style={{ maxWidth: `${width}px` }}
      >
        <div
          className="relative w-full max-h-full"
          style={{
            aspectRatio: `${width} / ${height}`,
          }}
        >
          {engine === null && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <CircleNotch
                className="size-20 animate-spin text-slate-600"
                weight="bold"
              />
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <BinsRow
          plinkoEngine={engine}
          rowCount={rows}
          riskLevel={risk}
          isAnimationOn={true}
          binColors={binColors}
        />
      </div>
    </div>
  );
};

export default Game;
