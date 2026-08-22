import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../config/api";
import { useActiveWalletType, useGameBalance } from "../../../hooks/useGameBalance";
import BetAmount from "../../Frame/BetAmount";
import checkLoggedIn from "../../../utils/isloggedIn";
import { requestWalletRefresh } from "../../../utils/walletEvents";

const DEALERS = ["Aanya", "Rohan", "Meera", "Kabir", "Isha", "Dev"];

const CAMERA_LOOP = {
  roulette: "/live/table-loop.mp4",
  show: "/live/table-loop.mp4",
  blackjack: "/live/cards-loop.mp4",
  baccarat: "/live/cards-loop.mp4",
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const defaultSelection = (tableType) => {
  if (tableType === "baccarat") return "player";
  if (tableType === "roulette") return "red";
  return "";
};

const resultCopy = (round) => {
  if (!round?.result) return "Place a bet to start the round.";
  if (round.tableType === "roulette") {
    return `Pocket ${round.result.pocket} · ${round.result.color}`;
  }
  if (round.tableType === "blackjack") {
    return `You ${round.result.player} · Dealer ${round.result.dealer}`;
  }
  if (round.tableType === "baccarat") {
    return `Player ${round.result.player} · Banker ${round.result.banker} · ${round.result.winner}`;
  }
  return `${round.result.segment} landed`;
};

const LiveStudio = ({ game, sessionId }) => {
  const navigate = useNavigate();
  const walletType = useActiveWalletType();
  const { balance, refresh } = useGameBalance(walletType);
  const [bet, setBet] = useState("10");
  const [selection, setSelection] = useState(defaultSelection(game.tableType));
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(null);
  const bankroll = Number(balance ?? 0);
  useEffect(() => {
    setSelection(defaultSelection(game.tableType));
    setRound(null);
  }, [game.slug, game.tableType]);

  const dealer = useMemo(() => {
    const index = String(game.slug || "")
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return DEALERS[index % DEALERS.length];
  }, [game.slug]);

  const requireLogin = () => {
    if (checkLoggedIn()) return true;
    navigate("?tab=login", { replace: true });
    return false;
  };

  const play = async () => {
    if (busy) return;
    if (!requireLogin()) return;
    const stake = Number(bet);
    if (!Number.isFinite(stake) || stake < 1) {
      toast.error("Enter a valid bet amount");
      return;
    }
    if (stake > bankroll) {
      toast.error(
        walletType === "cash"
          ? "Insufficient real balance"
          : "Insufficient demo balance"
      );
      return;
    }

    setBusy(true);
    try {
      const res = await apiService.games.playLive(game.slug, {
        betAmount: stake,
        selection,
        walletType,
      });
      const next = res.data?.round;
      setRound(next || null);
      requestWalletRefresh();
      refresh();
      if (next?.payout > 0) toast.success(`Won ${formatMoney(next.payout)}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Live round failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const actionLabel =
    game.tableType === "blackjack"
      ? "Deal"
      : game.tableType === "show"
        ? "Spin"
        : "Play";

  return (
    <div className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="game-stage my-12 mx-auto w-[96%] max-w-[1400px] rounded bg-primary max-md:max-w-[450px] max-lg:my-3 max-lg:max-w-[450px]">
          <div className="grid grid-cols-12 lg:h-[600px]">
            <aside className="order-2 col-span-12 overflow-auto bg-inactive max-lg:h-fit lg:order-1 lg:col-span-4 lg:h-[600px] xl:col-span-3">
              <div className="flex flex-col gap-3 px-3 py-4">
                <BetAmount bet={bet} setBet={setBet} disabled={busy} />

                {(game.selections || []).length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {game.selections.map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled={busy}
                        onClick={() => setSelection(option)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                          selection === option
                            ? "border-brand-primary bg-brand-primary text-black"
                            : "border-white/10 bg-white/5 text-text-secondary"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={busy}
                  onClick={play}
                  className="w-full rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition active:scale-90 disabled:opacity-60"
                >
                  {busy ? "Live…" : actionLabel}
                </button>
              </div>
            </aside>

            <div
              className="relative order-1 col-span-12 bg-gray-900 max-lg:min-h-[340px] lg:order-2 lg:col-span-8 lg:h-[600px] xl:col-span-9"
              style={{
                background: `radial-gradient(circle at top, ${
                  game.theme || "#E63946"
                }33, transparent 55%), #111827`,
              }}
            >
              <div className="flex h-full min-h-0 flex-col px-3 py-3 text-white lg:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      {game.name}
                    </p>
                    <p className="text-[11px] text-text-tertiary">
                      {game.studio} · Dealer {dealer}
                    </p>
                  </div>
                  <span className="rounded-full border border-red-400/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-100">
                    Live
                  </span>
                </div>

                <div className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <video
                    key={game.tableType}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={CAMERA_LOOP[game.tableType] || CAMERA_LOOP.roulette}
                    autoPlay
                    muted
                    loop
                    playsInline
                    disablePictureInPicture
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />
                  <div className="relative flex h-full flex-col justify-end p-4">
                    <p className="text-lg font-black drop-shadow">
                      {round ? resultCopy(round) : "Camera is live"}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-1.5">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
                    Last win
                  </span>
                  <span className="text-sm font-black">
                    {formatMoney(round?.payout || 0)}
                  </span>
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
  );
};

export default LiveStudio;
