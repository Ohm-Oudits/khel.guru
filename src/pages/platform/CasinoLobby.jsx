import { useEffect, useMemo, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import LiveWinFeed from "../../components/platform/LiveWinFeed";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import SwipeRail from "../../components/platform/SwipeRail";
import { apiService } from "../../config/api";
import { originals } from "../../constants";
import {
  GAME_LIKES_KEY,
  applyLikeToggle,
  formatLikeCount,
  likeCountOf,
  readLikesMap,
  writeLikesMap,
} from "../../utils/storedLikes";

const FAVORITES_STORAGE_KEY = "kg.favorite.originals";
const RECENTS_STORAGE_KEY = "kg.recent.originals";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "originals", label: "Originals" },
  { key: "slots", label: "Slots" },
  { key: "live", label: "Live" },
  { key: "trending", label: "Trending" },
  { key: "recent", label: "Recently Played", hideOnMobile: true },
];

const safeReadStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const safeWriteStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures in unsupported environments.
  }
};

const GameTile = ({ game, likes, isFavorite, onToggleFavorite, onOpen }) => (
  <Link
    to={game.link}
    onClick={() => onOpen(game.link)}
    className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
  >
    <div
      className="relative aspect-[4/5] bg-background-secondary"
      style={
        game.img
          ? {
              backgroundImage: `url(${game.img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              backgroundImage: `radial-gradient(circle at top, ${
                game.theme || "#00D4AA"
              }55, transparent 52%), linear-gradient(180deg, #141414, #0b0b0b)`,
            }
      }
    >
      <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
        <span
          className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${
            game.kind === "slot"
              ? "border border-violet-300/30 bg-violet-400/15 text-violet-100"
              : game.kind === "live"
                ? "border border-red-400/40 bg-red-500/15 text-red-100"
                : "border border-brand-primary/30 bg-brand-primary/10 text-brand-accent"
          }`}
        >
          {game.kind === "slot" ? "Slots" : game.kind === "live" ? "Live" : "Original"}
        </span>
        {game.kind !== "slot" && game.kind !== "live" && (game.exclusive || game.new) ? (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${
              game.new
                ? "border border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border border-white/15 bg-black/40 text-white/80"
            }`}
          >
            {game.new ? "New" : "Excl"}
          </span>
        ) : null}
      </div>
      {!game.img && game.icon ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl">
          {game.icon}
        </span>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onToggleFavorite(game.link);
        }}
        className="absolute right-1.5 top-1.5 rounded-full border border-white/10 bg-black/45 p-1.5 text-xs text-white transition hover:border-brand-primary/40 hover:text-brand-accent"
        aria-label={
          isFavorite
            ? `Remove ${game.name} from favorites`
            : `Add ${game.name} to favorites`
        }
      >
        <FaHeart className={isFavorite ? "text-brand-primary" : "text-white"} />
      </button>
    </div>
    <div className="flex items-center justify-between gap-1 p-2">
      <h3 className="truncate text-sm font-bold text-white">{game.name}</h3>
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-tertiary">
        {formatLikeCount(likes)}
        <FaHeart className="text-[10px] text-red-500" />
      </span>
    </div>
  </Link>
);

const CasinoLobby = () => {
  const [favoriteLinks, setFavoriteLinks] = useState([]);
  const [recentLinks, setRecentLinks] = useState([]);
  const [likesByLink, setLikesByLink] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [slots, setSlots] = useState([]);
  const [liveTables, setLiveTables] = useState([]);

  const likeCount = (link) => likeCountOf(likesByLink, link);

  useEffect(() => {
    setFavoriteLinks(safeReadStorage(FAVORITES_STORAGE_KEY));
    setRecentLinks(safeReadStorage(RECENTS_STORAGE_KEY));
    setLikesByLink(readLikesMap(GAME_LIKES_KEY));
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiService.games
      .getSlots()
      .then((res) => {
        if (cancelled) return;
        const games = (res.data?.games || []).map((slot) => ({
          ...slot,
          kind: "slot",
          id: slot.slug,
          img: slot.img || `/games/slots/${slot.slug}.png`,
        }));
        setSlots(games);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    apiService.games
      .getLive()
      .then((res) => {
        if (cancelled) return;
        const games = (res.data?.games || []).map((table) => ({
          ...table,
          kind: "live",
          id: table.slug,
          img: table.img || `/games/live/${table.slug}.png`,
        }));
        setLiveTables(games);
      })
      .catch(() => {
        if (!cancelled) setLiveTables([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const games = useMemo(() => {
    const byLikesDesc = (a, b) => likeCount(b.link) - likeCount(a.link);

    switch (activeFilter) {
      case "originals":
        return originals;
      case "slots":
        return [...slots].sort(byLikesDesc);
      case "live":
        return [...liveTables].sort(byLikesDesc);
      case "trending":
        return [...originals, ...slots, ...liveTables].sort(byLikesDesc).slice(0, 8);
      case "recent":
        return recentLinks
          .map(
            (link) =>
              originals.find((game) => game.link === link) ||
              slots.find((game) => game.link === link) ||
              liveTables.find((game) => game.link === link)
          )
          .filter(Boolean);
      case "all":
      default:
        return [...originals, ...slots, ...liveTables].sort(byLikesDesc);
    }
  }, [activeFilter, likesByLink, liveTables, recentLinks, slots]);

  const toggleFavorite = (link) => {
    const isLiked = favoriteLinks.includes(link);
    const nextFavorites = isLiked
      ? favoriteLinks.filter((entry) => entry !== link)
      : [link, ...favoriteLinks].slice(0, 12);
    const nextLikes = applyLikeToggle(likesByLink, link, isLiked);

    setFavoriteLinks(nextFavorites);
    setLikesByLink(nextLikes);
    safeWriteStorage(FAVORITES_STORAGE_KEY, nextFavorites);
    writeLikesMap(GAME_LIKES_KEY, nextLikes);
  };

  const registerRecentGame = (link) => {
    const nextRecents = [
      link,
      ...recentLinks.filter((entry) => entry !== link),
    ].slice(0, 8);

    setRecentLinks(nextRecents);
    safeWriteStorage(RECENTS_STORAGE_KEY, nextRecents);
  };

  return (
    <PlatformPage>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black text-white">Casino</h1>
        <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
                filter.hideOnMobile ? "hidden sm:inline-flex" : ""
              } ${
                activeFilter === filter.key
                  ? "border-brand-primary bg-brand-primary text-black"
                  : "border-white/10 bg-white/5 text-text-secondary hover:border-brand-primary/40 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {games.length ? (
        <SwipeRail label="Casino games" rowSize={10}>
          {games.map((game) => (
            <GameTile
              key={game.link}
              game={game}
              likes={likeCount(game.link)}
              isFavorite={favoriteLinks.includes(game.link)}
              onToggleFavorite={toggleFavorite}
              onOpen={registerRecentGame}
            />
          ))}
        </SwipeRail>
      ) : (
        <p className="text-sm text-text-secondary">
          {activeFilter === "recent"
            ? "No recently played games yet — pick one to get started."
            : activeFilter === "slots"
              ? "No partner slots in the catalog yet."
              : activeFilter === "live"
                ? "No live tables in the catalog yet."
                : "No games in this category yet."}
        </p>
      )}

      <PlatformPanel>
        <LiveWinFeed variant="casino" rows={20} detailed title="Bet Rolls" />
      </PlatformPanel>
    </PlatformPage>
  );
};

export default CasinoLobby;
