/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "tailwindcss/tailwind.css";
import "../../../styles/Crash.css";

import { getCrashSocket } from "../../../socket/games/crash";
import { CrashMarker } from "./CrashMarker";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GROWTH_K = 18;
const TICK_MS = 50;

const liveMultiplier = (elapsedSec) => Math.exp(elapsedSec / GROWTH_K);

const seedCurve = (elapsedSec, current) => {
  const points = [{ time: 0, multiplier: 1 }];
  if (elapsedSec <= 0.05) return points;
  const step = Math.min(0.08, Math.max(0.05, elapsedSec / 120));
  for (let t = step; t < elapsedSec; t += step) {
    points.push({ time: t, multiplier: liveMultiplier(t) });
  }
  points.push({ time: elapsedSec, multiplier: current });
  return points;
};

const Game = ({
  multiplier,
  setMultiplier,
  setDisableBet,
  onCrashHistory,
  onHistoryHydrate,
  onPhase,
  onFairness,
  onAutoCashout,
  autoCashoutAt,
  autoCashoutEnabled,
}) => {
  const [phase, setPhase] = useState("waiting");
  const [hasSynced, setHasSynced] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [cashoutPrompt, setCashoutPrompt] = useState(null);
  const [showCashoutPop, setShowCashoutPop] = useState(false);
  const [tip, setTip] = useState({ x: null, y: null, angle: -25 });
  const chartRef = useRef(null);
  const [data, setData] = useState([{ time: 0, multiplier: 1.0 }]);
  const [xMax, setXMax] = useState(12);
  const [yMax, setYMax] = useState(2);

  const phaseRef = useRef("waiting");
  const hasSyncedRef = useRef(false);
  const roundRef = useRef(null);
  const roundStartRef = useRef(Date.now());
  const waitUntilRef = useRef(null);
  const lastHistoryId = useRef(null);
  const hydratedHistory = useRef(false);
  const autoCashoutFired = useRef(false);
  const dataRef = useRef([{ time: 0, multiplier: 1.0 }]);
  const xMaxRef = useRef(12);
  const yMaxRef = useRef(2);

  const onPhaseRef = useRef(onPhase);
  const onFairnessRef = useRef(onFairness);
  const onCrashHistoryRef = useRef(onCrashHistory);
  const onHistoryHydrateRef = useRef(onHistoryHydrate);
  const onAutoCashoutRef = useRef(onAutoCashout);
  const autoCashoutAtRef = useRef(autoCashoutAt);
  const autoCashoutEnabledRef = useRef(autoCashoutEnabled);
  const setMultiplierRef = useRef(setMultiplier);
  const setDisableBetRef = useRef(setDisableBet);

  onPhaseRef.current = onPhase;
  onFairnessRef.current = onFairness;
  onCrashHistoryRef.current = onCrashHistory;
  onHistoryHydrateRef.current = onHistoryHydrate;
  onAutoCashoutRef.current = onAutoCashout;
  autoCashoutAtRef.current = autoCashoutAt;
  autoCashoutEnabledRef.current = autoCashoutEnabled;
  setMultiplierRef.current = setMultiplier;
  setDisableBetRef.current = setDisableBet;

  useEffect(() => {
    if (!cashoutPrompt) {
      setShowCashoutPop(false);
      return undefined;
    }
    const showTimer = setTimeout(() => setShowCashoutPop(true), 50);
    const hideTimer = setTimeout(() => setCashoutPrompt(null), 2600);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [cashoutPrompt]);

  const applyPoints = (points) => {
    dataRef.current = points;
    setData(points);
  };

  const resetGraph = () => {
    applyPoints([{ time: 0, multiplier: 1 }]);
    xMaxRef.current = 12;
    yMaxRef.current = 2;
    setXMax(12);
    setYMax(2);
    setTip({ x: null, y: null, angle: -25 });
    setMultiplierRef.current(1);
  };

  useEffect(() => {
    let cancelled = false;
    let boundSocket = null;
    let timer = null;

    const onState = (state) => {
      const nextPhase = state.phase || "waiting";
      const nextRound = state.round;
      const elapsedSec = (state.elapsedMs || 0) / 1000;
      const nextMult = Number(state.multiplier) || 1;
      const isFirstSync = !hasSyncedRef.current;
      const phaseChanged = nextPhase !== phaseRef.current;
      const roundChanged = nextRound !== roundRef.current;

      if (isFirstSync) {
        hasSyncedRef.current = true;
        setHasSynced(true);
      }

      if (phaseChanged || isFirstSync) {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
        setDisableBetRef.current(nextPhase !== "waiting");
        if (onPhaseRef.current) onPhaseRef.current(nextPhase);
        if (nextPhase === "waiting") {
          autoCashoutFired.current = false;
          setCashoutPrompt(null);
          resetGraph();
        }
      }

      if (onFairnessRef.current && state.fairness) {
        onFairnessRef.current(state.fairness);
      }

      if (nextPhase === "waiting" && Number.isFinite(Number(state.remainingMs))) {
        waitUntilRef.current = Date.now() + Number(state.remainingMs);
        setCountdown(Math.max(0, Math.ceil(Number(state.remainingMs) / 1000)));
      } else if (nextPhase !== "waiting") {
        waitUntilRef.current = null;
      }

      if (!hydratedHistory.current && Array.isArray(state.history)) {
        hydratedHistory.current = true;
        if (state.history[0]) lastHistoryId.current = state.history[0].id;
        if (onHistoryHydrateRef.current) {
          onHistoryHydrateRef.current(state.history);
        }
      }

      if (
        nextPhase === "running" &&
        (roundChanged || phaseChanged || isFirstSync)
      ) {
        roundRef.current = nextRound;
        roundStartRef.current = Date.now() - (state.elapsedMs || 0);
        autoCashoutFired.current = false;
        const points =
          elapsedSec < 0.2
            ? [{ time: 0, multiplier: 1 }]
            : seedCurve(elapsedSec, nextMult);
        applyPoints(points);
        xMaxRef.current = Math.max(12, elapsedSec * 1.25);
        yMaxRef.current = Math.max(2, nextMult * 1.15);
        setXMax(xMaxRef.current);
        setYMax(yMaxRef.current);
        setMultiplierRef.current(nextMult);
      }

      if (nextPhase === "crashed") {
        roundRef.current = nextRound;
        const crashAt = Number(state.crashPoint) || nextMult;
        setMultiplierRef.current(crashAt);
        setData((prev) => {
          const last = prev[prev.length - 1];
          if (last && Math.abs(last.multiplier - crashAt) < 0.001) {
            dataRef.current = prev;
            return prev;
          }
          const t = last ? last.time : elapsedSec;
          const next = [...prev, { time: t, multiplier: crashAt }];
          dataRef.current = next;
          return next;
        });

        if (Array.isArray(state.history) && state.history[0]) {
          const newest = state.history[0];
          if (newest.id !== lastHistoryId.current) {
            lastHistoryId.current = newest.id;
            if (onCrashHistoryRef.current) {
              onCrashHistoryRef.current(newest.value);
            }
          }
        }
      }
    };

    const onCashoutSuccess = ({ multiplier }) => {
      setCashoutPrompt({
        multiplier: Number(multiplier),
      });
    };

    const bind = (crashSocket) => {
      boundSocket = crashSocket;
      crashSocket.on("round_state", onState);
      crashSocket.on("cashout_success", onCashoutSuccess);
      if (crashSocket.connected) {
        crashSocket.emit("get_state", {});
      } else {
        crashSocket.once("connect", () => {
          crashSocket.emit("get_state", {});
        });
      }
    };

    const existing = getCrashSocket();
    if (existing) {
      bind(existing);
    } else {
      timer = setInterval(() => {
        if (cancelled) return;
        const crashSocket = getCrashSocket();
        if (crashSocket) {
          clearInterval(timer);
          timer = null;
          bind(crashSocket);
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      boundSocket?.off("round_state", onState);
      boundSocket?.off("cashout_success", onCashoutSuccess);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!hasSyncedRef.current) return;

      if (phaseRef.current === "waiting" && waitUntilRef.current) {
        const left = Math.max(0, waitUntilRef.current - Date.now());
        setCountdown(Math.ceil(left / 1000));
        return;
      }

      if (phaseRef.current !== "running") return;

      const elapsedSec = Math.max(
        0,
        (Date.now() - roundStartRef.current) / 1000
      );
      const nextMult = liveMultiplier(elapsedSec);
      setMultiplierRef.current(nextMult);

      const prev = dataRef.current;
      const last = prev[prev.length - 1];
      let next;
      if (last && elapsedSec - last.time < 0.045) {
        next = [...prev.slice(0, -1), { time: elapsedSec, multiplier: nextMult }];
      } else {
        next = [...prev, { time: elapsedSec, multiplier: nextMult }];
      }
      applyPoints(next);

      const chart = chartRef.current;
      if (chart) {
        const meta = chart.getDatasetMeta(0);
        const pts = meta?.data || [];
        if (pts.length) {
          const last = pts[pts.length - 1];
          const prev = pts[Math.max(0, pts.length - 5)];
          setTip({
            x: last.x,
            y: last.y,
            angle: (Math.atan2(last.y - prev.y, last.x - prev.x) * 180) / Math.PI,
          });
        }
      }

      // Keep the tip in view the original way: when X grows, Y grows with it.
      if (elapsedSec > xMaxRef.current * 0.9) {
        xMaxRef.current = elapsedSec * 1.1;
        yMaxRef.current = Math.max(2, nextMult * 1.1);
        setXMax(xMaxRef.current);
        setYMax(yMaxRef.current);
      }
      if (nextMult * 0.8 > yMaxRef.current) {
        xMaxRef.current = elapsedSec * 1.1;
        yMaxRef.current = nextMult * 1.1;
        setXMax(xMaxRef.current);
        setYMax(yMaxRef.current);
      }

      if (
        autoCashoutEnabledRef.current &&
        !autoCashoutFired.current &&
        onAutoCashoutRef.current &&
        Number(autoCashoutAtRef.current) >= 1.01 &&
        nextMult >= Number(autoCashoutAtRef.current)
      ) {
        autoCashoutFired.current = true;
        onAutoCashoutRef.current(Number(autoCashoutAtRef.current));
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, []);

  const chartData = {
    datasets: [
      {
        label: "Multiplier",
        data: data.map((d) => ({ x: d.time, y: d.multiplier })),
        borderColor: phase === "crashed" ? "gray" : "white",
        backgroundColor: phase === "crashed" ? "gray" : "white",
        pointRadius: 0,
        borderWidth: 6,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: xMax,
        ticks: {
          font: { size: 10 },
          callback: (value) => value.toFixed(2),
          stepSize: xMax / 8,
        },
      },
      y: {
        min: 1,
        max: yMax,
        ticks: {
          font: { size: 10 },
          callback: (value) => value.toFixed(2),
          stepSize: yMax / 10,
        },
      },
    },
    animation: { duration: 0 },
  };

  return (
    <div className="flex relative pt-10 flex-col items-center justify-center w-full h-full bg-gray-900 text-white max-lg:pt-8 lg:pt-16">
      <div className="w-full h-full max-lg:h-[240px] max-lg:p-3 p-6 lg:h-full">
        <div className="relative h-full w-full">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
          <CrashMarker
            crashed={phase === "crashed"}
            visible={
              hasSynced && (phase === "running" || phase === "crashed")
            }
            x={tip.x}
            y={tip.y}
            angle={tip.angle}
          />
        </div>
      </div>

      <div
        className={`absolute text-3xl flex items-center flex-col max-md:text-xl font-semibold ${
          hasSynced && phase === "waiting" && countdown > 0 ? "blink" : ""
        } ${phase === "crashed" ? "zoom-in" : ""}`}
      >
        {cashoutPrompt && (
          <div
            className={`pointer-events-none mb-2 rounded-lg px-3 py-0.5 text-2xl font-black tabular-nums shadow-lg transition-all duration-300 ease-out max-md:text-lg lg:text-3xl ${
              showCashoutPop ? "scale-100 opacity-100" : "scale-50 opacity-0"
            } bg-emerald-500 text-black`}
          >
            {Number(cashoutPrompt.multiplier).toFixed(2)}x
          </div>
        )}
        {!hasSynced ? (
          <>
            <span className="text-white/70">—</span>
            <span className="text-white/50 text-sm font-medium mt-1">
              Syncing round
            </span>
          </>
        ) : phase === "crashed" ? (
          <>
            <span className="text-red-500">{`${Number(multiplier).toFixed(2)}x`}</span>
            <span>Crashed</span>
          </>
        ) : phase === "waiting" ? (
          <>
            <span>{Math.max(countdown, 0)}</span>
            <span className="text-white/50 text-sm font-medium mt-1">
              Next round
            </span>
          </>
        ) : (
          <span>{`${Number(multiplier).toFixed(2)}x`}</span>
        )}
      </div>
    </div>
  );
};

export default Game;
