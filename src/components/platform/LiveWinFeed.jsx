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

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const makeEntry = (variant, id) => {
  const kind =
    variant === "both" ? (Math.random() < 0.5 ? "casino" : "sports") : variant;
  const label = pick(kind === "sports" ? SPORTS_PLAYS : CASINO_PLAYS);
  const multiplier = (1 + Math.random() * 12).toFixed(2);
  const payout = Math.floor(40 + Math.random() * 9000);
  return {
    id,
    user: pick(USERNAMES),
    label,
    kind,
    multiplier,
    payout: `₹${payout.toLocaleString("en-IN")}`,
  };
};

// A live-updating wins feed. New rows animate in at the top and the oldest
// drops off the bottom. The scroll window has a FIXED pixel height with
// overflow clipped, so row enter/exit never resizes the panel (no border
// bounce). In `fill` mode the row count is measured from the parent height.
const LiveWinFeed = ({ variant = "both", rows = 8, fill = false, title = "Live Wins" }) => {
  const counter = useRef(0);
  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const [count, setCount] = useState(rows);
  const [entries, setEntries] = useState(() =>
    Array.from({ length: rows }, () => makeEntry(variant, counter.current++))
  );

  useLayoutEffect(() => {
    if (!fill) {
      setCount(rows);
      return undefined;
    }
    const measure = () => {
      const root = rootRef.current;
      const header = headerRef.current;
      if (!root) return;
      const available = root.clientHeight - (header?.offsetHeight || 0);
      setCount(Math.max(4, Math.floor(available / ROW_PX)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fill, rows]);

  // Keep the entry list sized to `count` (grow to fill, trim if smaller).
  useEffect(() => {
    setEntries((prev) => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      const extra = Array.from({ length: count - prev.length }, () =>
        makeEntry(variant, counter.current++)
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
              className="flex items-center justify-between gap-2 rounded bg-black/20 px-2 py-1 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-semibold text-white">
                  {entry.user}
                </span>
                <span className="truncate text-text-tertiary">{entry.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-text-tertiary">{entry.multiplier}x</span>
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
