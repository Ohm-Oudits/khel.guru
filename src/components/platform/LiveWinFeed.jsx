import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const USERNAMES = [
  "Yash", "Alice", "Rohan", "Meera", "Kunal", "Zara", "Arjun", "Neha",
  "Sam", "Priya", "Vikram", "Aisha", "Dev", "Tara", "Kabir", "Isha",
  "Omar", "Lily", "Raj", "Nina",
];

const CASINO_PLAYS = [
  "Crash", "Mines", "Plinko", "Dice", "Limbo", "Wheel", "Keno", "Roulette",
  "Blackjack", "Baccarat", "Hilo", "Tower", "Parachute", "Balloons",
];

const SPORTS_PLAYS = [
  "IND vs AUS", "Arsenal vs Liverpool", "MI vs CSK", "Man City vs Chelsea",
  "RCB vs KKR", "Sinner vs Alcaraz", "Sen vs Axelsen", "ENG vs SA",
  "Real Madrid vs Barca", "Djokovic vs Medvedev",
];

const ROW_PX = 26;
const DETAILED_ROW_PX = 56;
const TABLE_COLUMNS =
  "minmax(7.5rem,1.5fr) minmax(5rem,1fr) minmax(4.5rem,0.8fr) minmax(6rem,1fr) minmax(5rem,0.85fr) minmax(6rem,1fr)";
const WIDE_BREAKPOINT = 1280;
const TABLE_BREAKPOINT = 1024;

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const fmtTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = (date) =>
  date.toLocaleDateString([], { day: "2-digit", month: "short" });

const makeEntry = (variant, id, ageMs = 0) => {
  const kind =
    variant === "both" ? (Math.random() < 0.5 ? "casino" : "sports") : variant;
  const label = pick(kind === "sports" ? SPORTS_PLAYS : CASINO_PLAYS);
  const won = Math.random() > 0.42;
  const multiplier = Number(
    (won ? 1.1 + Math.random() * 11.9 : 1 + Math.random() * 4).toFixed(2)
  );
  const betAmount = Math.floor(20 + Math.random() * 2400);
  const payout = won ? Math.floor(betAmount * multiplier) : 0;
  const when = new Date(Date.now() - ageMs);
  return {
    id,
    user: pick(USERNAMES),
    label,
    kind,
    won,
    multiplier: multiplier.toFixed(2),
    betAmount: `₹${betAmount.toLocaleString("en-IN")}`,
    payout: `₹${payout.toLocaleString("en-IN")}`,
    date: fmtDate(when),
    time: fmtTime(when),
  };
};

const LiveWinFeed = ({
  variant = "both",
  rows = 8,
  fill = false,
  detailed = false,
  title = "Live Wins",
}) => {
  const counter = useRef(0);
  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const [showTable, setShowTable] = useState(
    () =>
      Boolean(detailed) &&
      (typeof window === "undefined" || window.innerWidth >= TABLE_BREAKPOINT)
  );
  const rowPx = showTable ? DETAILED_ROW_PX : ROW_PX;
  const [count, setCount] = useState(rows);
  const [entries, setEntries] = useState(() =>
    Array.from({ length: rows }, (_, i) =>
      makeEntry(variant, counter.current++, i * 45000 + Math.random() * 30000)
    )
  );

  useLayoutEffect(() => {
    const apply = () => {
      const width = window.innerWidth;
      const table = Boolean(detailed) && width >= TABLE_BREAKPOINT;
      setShowTable(table);
      if (!fill || width < WIDE_BREAKPOINT) {
        setCount(rows);
        return;
      }
      const root = rootRef.current;
      const header = headerRef.current;
      if (!root) return;
      const available = root.clientHeight - (header?.offsetHeight || 0);
      const px = table ? DETAILED_ROW_PX : ROW_PX;
      setCount(Math.max(4, Math.floor(available / px)));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [fill, rows, detailed]);

  useEffect(() => {
    setEntries((prev) => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      const extra = Array.from({ length: count - prev.length }, (_, i) =>
        makeEntry(variant, counter.current++, (prev.length + i) * 45000)
      );
      return [...prev, ...extra];
    });
  }, [count, variant]);

  useEffect(() => {
    let timer;
    const tick = () => {
      setEntries((prev) =>
        [makeEntry(variant, counter.current++), ...prev].slice(0, count)
      );
      timer = setTimeout(tick, 1500 + Math.random() * 2500);
    };
    timer = setTimeout(tick, 1800 + Math.random() * 1800);
    return () => clearTimeout(timer);
  }, [variant, count]);

  return (
    <div ref={rootRef} className="flex h-full flex-col">
      <div ref={headerRef}>
        {showTable ? (
          <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]" />
            <h2 className="text-xl font-black tracking-tight text-white">
              {title}
            </h2>
          </div>
        ) : (
          <div className="mb-2">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]" />
              <h2 className="text-sm font-black tracking-tight text-white">
                {title}
              </h2>
            </div>
          </div>
        )}
      </div>
      <div className={showTable ? "min-w-0 overflow-x-auto" : ""}>
        {showTable ? (
          <div
            className="mb-1 grid min-w-[42rem] gap-x-6 px-3 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary"
            style={{ gridTemplateColumns: TABLE_COLUMNS }}
          >
            <span>Game</span>
            <span>User</span>
            <span>Time</span>
            <span className="text-right">Bet Amount</span>
            <span className="text-right">Multiplier</span>
            <span className="text-right">Payout</span>
          </div>
        ) : null}
        <div
          className={showTable ? "overflow-hidden" : "space-y-0.5 overflow-hidden"}
          style={{
            height: count * rowPx,
            minWidth: showTable ? "42rem" : undefined,
          }}
        >
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={
                  showTable
                    ? "border-t border-white/[0.06] px-3 text-[15px] leading-none"
                    : "rounded-lg bg-black/20 px-3 py-1 text-xs"
                }
                style={showTable ? { height: DETAILED_ROW_PX } : undefined}
              >
                {showTable ? (
                  <div
                    className="grid h-full items-center gap-x-6"
                    style={{ gridTemplateColumns: TABLE_COLUMNS }}
                  >
                    <span className="truncate font-semibold text-white">
                      {entry.label}
                    </span>
                    <span className="truncate text-text-secondary">
                      {entry.user}
                    </span>
                    <span className="truncate tabular-nums text-sm text-text-tertiary">
                      {entry.time}
                    </span>
                    <span className="truncate text-right tabular-nums text-text-secondary">
                      {entry.betAmount}
                    </span>
                    <span
                      className={`truncate text-right tabular-nums ${
                        entry.won ? "text-text-tertiary" : "text-rose-400"
                      }`}
                    >
                      {entry.multiplier}x
                    </span>
                    <span
                      className={`truncate text-right tabular-nums font-semibold ${
                        entry.won ? "text-brand-primary" : "text-text-tertiary"
                      }`}
                    >
                      {entry.payout}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold text-white">
                        {entry.user}
                      </span>
                      <span className="truncate text-text-tertiary">
                        {entry.label}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={
                          entry.won ? "text-text-tertiary" : "text-rose-400"
                        }
                      >
                        {entry.multiplier}x
                      </span>
                      <span
                        className={`font-bold ${
                          entry.won
                            ? "text-brand-primary"
                            : "text-text-tertiary"
                        }`}
                      >
                        {entry.won ? entry.payout : "₹0"}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LiveWinFeed;
