import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const USERNAMES = [
  "Yash", "Alice", "Rohan", "Meera", "Kunal", "Zara", "Arjun", "Neha",
  "Sam", "Priya", "Vikram", "Aisha", "Dev", "Tara", "Kabir", "Isha",
  "Omar", "Lily", "Raj", "Nina",
];

const CASINO_PLAYS = [
  "Crash", "Mines", "Plinko", "Dice", "Limbo", "Wheel", "Keno", "Roulette",
  "Blackjack", "Baccarat", "Hilo", "Tower", "Balloons",
];

const SPORTS_PLAYS = [
  "IND vs AUS", "Arsenal vs Liverpool", "MI vs CSK", "Man City vs Chelsea",
  "RCB vs KKR", "Sinner vs Alcaraz", "Sen vs Axelsen", "ENG vs SA",
  "Real Madrid vs Barca", "Djokovic vs Medvedev",
];

// Rendered height of one row (py-1 + text + space-y-0.5 gap).
const ROW_PX = 26;
const WIDE_BREAKPOINT = 1280;

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const fmtTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = (date) =>
  date.toLocaleDateString([], { day: "2-digit", month: "short" });

const makeEntry = (variant, id, ageMs = 0) => {
  const kind =
    variant === "both" ? (Math.random() < 0.5 ? "casino" : "sports") : variant;
  const label = pick(kind === "sports" ? SPORTS_PLAYS : CASINO_PLAYS);
  const multiplier = (1 + Math.random() * 12).toFixed(2);
  const payout = Math.floor(40 + Math.random() * 9000);
  const when = new Date(Date.now() - ageMs);
  return {
    id,
    user: pick(USERNAMES),
    label,
    kind,
    multiplier,
    payout: `₹${payout.toLocaleString("en-IN")}`,
    date: fmtDate(when),
    time: fmtTime(when),
  };
};

// A live-updating wins feed. New rows animate in at the top and the oldest
// drops off the bottom. The scroll window has a FIXED pixel height with
// overflow clipped, so row enter/exit never resizes the panel (no border
// bounce). `fill` measures the parent height (desktop only); `detailed`
// shows date + time columns.
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
  const [count, setCount] = useState(rows);
  const [entries, setEntries] = useState(() =>
    Array.from({ length: rows }, (_, i) =>
      makeEntry(variant, counter.current++, i * 45000 + Math.random() * 30000)
    )
  );

  useLayoutEffect(() => {
    const apply = () => {
      const wide = window.innerWidth >= WIDE_BREAKPOINT;
      if (!fill || !wide) {
        setCount(rows);
        return;
      }
      const root = rootRef.current;
      const header = headerRef.current;
      if (!root) return;
      const available = root.clientHeight - (header?.offsetHeight || 0);
      setCount(Math.max(4, Math.floor(available / ROW_PX)));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [fill, rows]);

  // Keep the entry list sized to `count`.
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
      <div ref={headerRef} className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
          {title}
        </h2>
      </div>
      <div
        className="space-y-0.5 overflow-hidden"
        style={{ height: count * ROW_PX }}
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
              className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-1 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-semibold text-white">
                  {entry.user}
                </span>
                <span className="truncate text-text-tertiary">{entry.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-text-tertiary">
                {detailed ? (
                  <>
                    <span className="hidden sm:inline">{entry.date}</span>
                    <span>{entry.time}</span>
                  </>
                ) : null}
                <span>{entry.multiplier}x</span>
                <span className="font-bold text-brand-primary">{entry.payout}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveWinFeed;
