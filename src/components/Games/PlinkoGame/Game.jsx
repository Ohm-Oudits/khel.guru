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
    const isValid = bet && !isNaN(bet) && parseFloat(bet) > 0;
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
      const { balance, payout, multiplier } = event.detail;

      toast.success(`Win! ${payout.toFixed(8)} (${multiplier}x)`);
    };

    const handleGameError = (event) => {
      const { message } = event.detail;
      toast.error(message);
    };

    window.addEventListener("plinko:result", handleGameResult);
    window.addEventListener("plinko:error", handleGameError);

    return () => {
      // Only detach our listeners; don't tear down the shared socket on every
      // effect re-run, which disconnected it mid-handshake and dropped bets.
      const plinkoSocket = getPlinkoSocket();
      if (plinkoSocket) {
        plinkoSocket.off("error");
      }

      window.removeEventListener("plinko:result", handleGameResult);
      window.removeEventListener("plinko:error", handleGameError);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <div
        className="mx-auto flex h-full flex-col items-center justify-center px-4 pb-4"
        style={{ maxWidth: `${width}px` }}
      >
        {/* Canvas container */}
        <div
          className="relative w-full h-full"
          style={{
            aspectRatio: `${width} / ${height}`,
          }}
        >
          {/* Loader for engine initialization */}
          {engine === null && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <CircleNotch
                className="size-20 animate-spin text-slate-600"
                weight="bold"
              />
            </div>
          )}
          {/* Canvas rendering the Plinko game */}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 h-full w-full"
          />
        </div>

        {/*Bin row at the bottom */}
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
