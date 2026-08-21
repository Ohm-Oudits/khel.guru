import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SLOT = 58;
const SIDE_PAD = 20;

const getValue = (item) =>
  parseFloat(item.roll ?? item.value ?? item.result ?? item.multiplier);

const isRollChip = (item) => item.roll != null && item.multiplier == null;

const chronological = (list) => {
  const copy = [...list];
  const timed = copy.every(
    (item) => Date.parse(item.timestamp) || Number(item.id) > 1e11
  );
  if (timed) {
    copy.sort((a, b) => {
      const ta = Date.parse(a.timestamp) || Number(a.id) || 0;
      const tb = Date.parse(b.timestamp) || Number(b.id) || 0;
      return ta - tb;
    });
    return copy;
  }

  const numericIds = copy.every((item) => Number.isFinite(Number(item.id)));
  if (numericIds) {
    copy.sort((a, b) => Number(a.id) - Number(b.id));
  }
  return copy;
};

const CRASH_TONES = [
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-400/15 text-amber-300",
  "bg-sky-400/15 text-sky-400",
  "bg-violet-400/15 text-violet-300",
  "bg-rose-400/15 text-rose-400",
  "bg-teal-400/15 text-teal-300",
];

const PARACHUTE_TONES = [
  "bg-black text-white ring-1 ring-zinc-600/90",
  "bg-green-700 text-green-50",
  "bg-red-700 text-red-50",
  "bg-violet-700 text-violet-50",
  "bg-zinc-900 text-zinc-100 ring-1 ring-zinc-700",
  "bg-emerald-800 text-emerald-50",
];

const chipClass = (item, value, palette, index) => {
  if (palette === "roulette") {
    const tone = item.color ?? (value === 0 ? "green" : "black");
    if (tone === "green") return "bg-green-600 text-white";
    if (tone === "red") return "bg-red-600 text-white";
    return "bg-black text-white ring-1 ring-zinc-600/80";
  }

  if (palette === "wheel") {
    if (value <= 0) return "bg-rose-500/15 text-rose-400";
    if (value >= 2) return "bg-emerald-500/15 text-emerald-400";
    return "bg-amber-400/15 text-amber-300";
  }

  if (palette === "crash") {
    const seed = Number.isFinite(Number(item.id))
      ? Number(item.id)
      : Math.round(value * 100) + index;
    return CRASH_TONES[Math.abs(seed) % CRASH_TONES.length];
  }

  if (palette === "parachute") {
    const seed = Number.isFinite(Number(item.id))
      ? Number(item.id)
      : Math.round(value * 100) + index;
    return PARACHUTE_TONES[Math.abs(seed) % PARACHUTE_TONES.length];
  }

  if (palette === "pump") {
    const lose =
      item.isWin === false ||
      item.won === false ||
      item.color === "#B91C1C" ||
      item.color === "red";
    if (lose) return "bg-red-700 text-red-50";
    return "bg-green-700 text-green-50";
  }

  const lose =
    item.isWin === false ||
    item.color === "#DC2626" ||
    item.color === "#B91C1C" ||
    item.color === "red";
  const win = item.isWin === true;

  if (lose) return "bg-rose-500/15 text-rose-400";
  if (win) return "bg-emerald-500/15 text-emerald-400";
  if (value >= 10) return "bg-amber-400/15 text-amber-300";
  if (value >= 2) return "bg-emerald-500/15 text-emerald-400";
  return "bg-white/10 text-white/55";
};

const History = ({ list = [], palette = "default" }) => {
  const trackRef = useRef(null);
  const [slots, setSlots] = useState(8);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      const inner = Math.max(0, el.clientWidth - SIDE_PAD * 2);
      setSlots(Math.max(1, Math.floor(inner / SLOT)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const validList = chronological(
    (list || []).filter((item) => Number.isFinite(getValue(item)))
  );
  const visible = validList.slice(-slots);

  return (
    <div
      ref={trackRef}
      className="pointer-events-none flex h-9 w-full items-center justify-end overflow-hidden"
      style={{ paddingLeft: SIDE_PAD, paddingRight: SIDE_PAD }}
    >
      <div className="flex items-center justify-end gap-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item, index) => {
            const value = getValue(item);
            const label =
              palette === "roulette"
                ? String(value)
                : isRollChip(item)
                  ? value.toFixed(1)
                  : `${value.toFixed(value >= 100 ? 0 : 2)}x`;

            return (
              <motion.div
                key={item.id ?? `${value}-${item.timestamp ?? ""}`}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.86 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.86 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-center justify-center rounded-full font-bold leading-none whitespace-nowrap ${
                  palette === "roulette"
                    ? "h-7 min-w-[1.85rem] px-2 text-[11px]"
                    : "h-7 min-w-[3.25rem] px-2.5 text-[11px]"
                } ${chipClass(item, value, palette, index)}`}
              >
                {label}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default History;
