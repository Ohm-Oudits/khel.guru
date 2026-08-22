import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../config/api";
import { useActiveWalletType, useGameBalance } from "../../../hooks/useGameBalance";
import BetAmount from "../../Frame/BetAmount";
import checkLoggedIn from "../../../utils/isloggedIn";
import { requestWalletRefresh } from "../../../utils/walletEvents";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const emptyGrid = (game) => {
  const symbols = game?.symbols?.length ? game.symbols : [{ glyph: "✦", id: "ace", label: "Ace" }];
  return Array.from({ length: game?.rows || 3 }, (_, row) =>
    Array.from({ length: game?.reels || 5 }, (_, reel) => symbols[(row + reel) % symbols.length])
  );
};

const randomGrid = (game) => {
  const symbols = game?.symbols?.length ? game.symbols : [{ glyph: "✦" }];
  return Array.from({ length: game?.rows || 3 }, () =>
    Array.from({ length: game?.reels || 5 }, () => symbols[Math.floor(Math.random() * symbols.length)])
  );
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const HouseSlotMachine = ({ game, sessionId }) => {
  const navigate = useNavigate();
  const walletType = useActiveWalletType();
  const { balance, refresh } = useGameBalance(walletType);
  const [bet, setBet] = useState("10");
  const [grid, setGrid] = useState(() => emptyGrid(game));
  const [spinning, setSpinning] = useState(false);
  const [autoLeft, setAutoLeft] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [wins, setWins] = useState([]);
  const [showPaytable, setShowPaytable] = useState(false);
  const spinLock = useRef(false);

  const minBet = game?.minBet || 1;
  const maxBet = game?.maxBet || 10000;
  const bankroll = Number(balance ?? 0);
  const winningCells = useMemo(() => {
    const cells = new Set();
    wins.forEach((win) => {
      (win.cells || []).forEach(([row, reel]) => cells.add(`${row}:${reel}`));
    });
    return cells;
  }, [wins]);

  useEffect(() => {
    setGrid(emptyGrid(game));
    setWins([]);
    setLastWin(0);
  }, [game?.slug]);

  const requireLogin = () => {
    if (checkLoggedIn()) return true;
    navigate("?tab=login", { replace: true });
    return false;
  };

  const runSpin = async () => {
    if (spinLock.current) return false;
    if (!requireLogin()) return false;
    const stake = Number(bet);
    if (!Number.isFinite(stake) || stake < minBet) {
      toast.error(`Minimum bet is ${formatMoney(minBet)}`);
      return false;
    }
    if (walletType === "cash" && stake <= 0) {
      toast.error("Enter a bet amount");
      return false;
    }
    if (stake > bankroll) {
      toast.error(
        walletType === "cash"
          ? "Insufficient real balance"
          : "Insufficient demo balance"
      );
      return false;
    }

    spinLock.current = true;
    setSpinning(true);
    setWins([]);
    const flicker = setInterval(() => setGrid(randomGrid(game)), 70);

    try {
      const res = await apiService.games.spinSlot(game.slug, {
        betAmount: stake,
        walletType,
      });
      const result = res.data?.spin;
      if (!result?.grid) throw new Error("Spin failed");

      clearInterval(flicker);
      for (let reel = 0; reel < (game.reels || 5); reel += 1) {
        setGrid((current) =>
          current.map((row, rowIndex) =>
            row.map((cell, reelIndex) =>
              reelIndex <= reel ? result.grid[rowIndex][reelIndex] : cell
            )
          )
        );
        await wait(140);
      }

      setWins(result.wins || []);
      setLastWin(result.payout || 0);

      requestWalletRefresh();
      refresh();

      if (result.payout > 0) {
        toast.success(`Won ${formatMoney(result.payout)}`);
      }
      return true;
    } catch (error) {
      clearInterval(flicker);
      setGrid(emptyGrid(game));
      toast.error(
        error.response?.data?.message || error.message || "Could not spin this slot."
      );
      return false;
    } finally {
      clearInterval(flicker);
      setSpinning(false);
      spinLock.current = false;
    }
  };

  useEffect(() => {
    if (autoLeft <= 0 || spinning) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const ok = await runSpin();
      if (!cancelled) setAutoLeft((left) => (ok ? Math.max(0, left - 1) : 0));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [autoLeft, spinning]);

  return (
    <div className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px]">
      <div className="mx-auto max-w-[1200px]">
      <div className="game-stage my-12 max-lg:my-3 mx-auto w-[96%] max-w-[1400px] rounded bg-primary max-md:max-w-[450px] max-lg:max-w-[450px]">
        <div className="relative flex flex-col gap-[0.15rem]">
          <div className="grid grid-cols-12 lg:h-[600px]">
            <aside className="order-2 col-span-12 overflow-auto bg-inactive max-lg:h-fit lg:order-1 lg:col-span-4 lg:h-[600px] xl:col-span-3">
              <div className="flex flex-col gap-3 px-3 py-4">
                <BetAmount
                  bet={bet}
                  setBet={setBet}
                  disabled={spinning || autoLeft > 0}
                  maxValue={String(maxBet)}
                />

                <button
                  type="button"
                  disabled={spinning}
                  onClick={runSpin}
                  className="w-full rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition active:scale-90 disabled:opacity-60"
                >
                  {spinning ? "Spinning…" : "Spin"}
                </button>
                <button
                  type="button"
                  disabled={spinning && autoLeft === 0}
                  onClick={() => setAutoLeft((left) => (left > 0 ? 0 : 10))}
                  className="w-full rounded-lg border border-white/10 py-2 text-sm font-bold text-white"
                >
                  {autoLeft > 0 ? `Stop (${autoLeft})` : "Auto 10"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPaytable((open) => !open)}
                  className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-text-secondary"
                >
                  {showPaytable ? "Hide paytable" : "Show paytable"}
                </button>

                {showPaytable ? (
                  <div className="grid gap-1">
                    {(game.symbols || []).map((symbol) => {
                      const pays = game.paytable?.[symbol.id] || {};
                      return (
                        <div
                          key={symbol.id}
                          className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1 text-xs text-white"
                        >
                          <span>
                            {symbol.glyph} {symbol.label}
                          </span>
                          <span className="text-text-tertiary">
                            3×{pays[3] || 0} · 4×{pays[4] || 0} · 5×{pays[5] || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <p className="mt-auto text-[10px] leading-4 text-text-tertiary">
                  Spin the house reels now. A partner embed will replace this
                  machine when an aggregator is wired.
                </p>
              </div>
            </aside>

            <div
              className="relative order-1 col-span-12 bg-gray-900 max-lg:min-h-[340px] lg:order-2 lg:col-span-8 lg:h-[600px] xl:col-span-9"
              style={{
                background: `radial-gradient(circle at top, ${
                  game.theme || "#00D4AA"
                }33, transparent 55%), #111827`,
              }}
            >
              <div className="flex h-full min-h-0 flex-col px-3 py-2 text-white lg:px-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold">{game.name}</p>
                  <p className="shrink-0 text-[11px] text-text-tertiary">
                    {game.paylineCount || 5} lines · RTP {game.rtp}% ·{" "}
                    {game.volatility}
                  </p>
                </div>

                <div className="mt-2 grid min-h-0 flex-1 grid-cols-5 gap-1.5 rounded-2xl bg-black/50 p-2">
                  {(grid[0] || []).map((_, reel) => (
                    <div key={`reel-${reel}`} className="grid min-h-0 grid-rows-3 gap-1.5">
                      {grid.map((row, rowIndex) => {
                        const cell = row[reel] || {};
                        const lit = winningCells.has(`${rowIndex}:${reel}`);
                        return (
                          <div
                            key={`${rowIndex}-${reel}`}
                            className={`flex min-h-0 items-center justify-center rounded-xl border text-2xl lg:text-4xl ${
                              lit
                                ? "border-brand-primary bg-brand-primary/15 shadow-[0_0_18px_rgba(0,212,170,0.35)]"
                                : "border-white/10 bg-white/5"
                            } ${spinning ? "animate-pulse" : ""}`}
                            title={cell.label}
                          >
                            {cell.glyph}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-1.5">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
                    Last win
                  </span>
                  <span className="text-sm font-black">{formatMoney(lastWin)}</span>
                </div>
                {sessionId ? (
                  <p className="mt-1 text-right font-mono text-[10px] text-text-tertiary">
                    {sessionId.slice(-12)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default HouseSlotMachine;
