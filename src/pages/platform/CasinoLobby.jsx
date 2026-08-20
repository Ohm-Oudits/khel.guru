import { useEffect, useMemo, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import LiveWinFeed from "../../components/platform/LiveWinFeed";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { originals } from "../../constants";

const FAVORITES_STORAGE_KEY = "kg.favorite.originals";
const RECENTS_STORAGE_KEY = "kg.recent.originals";

// Table games are the "live casino" style titles in this catalog.
const LIVE_GAME_LINKS = new Set([
  "/game/baccarat",
  "/game/blackjack",
  "/game/roulette",
]);

const FILTERS = [
  { key: "all", label: "All" },
  { key: "originals", label: "Originals" },
  { key: "live", label: "Live" },
  { key: "trending", label: "Trending" },
  { key: "recent", label: "Recently Played", hideOnMobile: true },
];

// Stable per-game like count (no real likes source yet) so the number does
// not flicker between renders.
const gameLikes = (game) => {
  const seed = String(game.name)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), game.id || 0);
  return 4200 + (seed * 733) % 95000;
};

const formatCount = (count) =>
  count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);

const byLikesDesc = (a, b) => gameLikes(b) - gameLikes(a);

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

const CasinoLobby = () => {
  const [favoriteLinks, setFavoriteLinks] = useState([]);
  const [recentLinks, setRecentLinks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    setFavoriteLinks(safeReadStorage(FAVORITES_STORAGE_KEY));
    setRecentLinks(safeReadStorage(RECENTS_STORAGE_KEY));
  }, []);

  const games = useMemo(() => {
    switch (activeFilter) {
      case "originals":
        return originals.filter((game) => !LIVE_GAME_LINKS.has(game.link));
      case "live":
        return originals.filter((game) => LIVE_GAME_LINKS.has(game.link));
      case "trending":
        return [...originals].sort(byLikesDesc).slice(0, 8);
      case "recent":
        return recentLinks
          .map((link) => originals.find((game) => game.link === link))
          .filter(Boolean);
      case "all":
      default:
        return [...originals].sort(byLikesDesc);
    }
  }, [activeFilter, recentLinks]);

  const toggleFavorite = (link) => {
    const nextFavorites = favoriteLinks.includes(link)
      ? favoriteLinks.filter((entry) => entry !== link)
      : [link, ...favoriteLinks].slice(0, 12);

    setFavoriteLinks(nextFavorites);
    safeWriteStorage(FAVORITES_STORAGE_KEY, nextFavorites);
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
      {/* Header + category row, separate from the games grid */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black text-white">Casino</h1>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {games.map((game) => (
            <Link
              key={game.link}
              to={game.link}
              onClick={() => registerRecentGame(game.link)}
              className="group overflow-hidden rounded-xl border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
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
                    : undefined
                }
              >
                {!game.img ? (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,212,170,0.28),_transparent_42%),linear-gradient(180deg,_rgba(8,8,8,0.9),_rgba(18,18,18,1))]" />
                ) : null}
                {game.exclusive || game.new ? (
                  <span
                    className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
                      game.new
                        ? "border border-amber-300/30 bg-amber-300/10 text-amber-100"
                        : "border border-brand-primary/30 bg-brand-primary/10 text-brand-accent"
                    }`}
                  >
                    {game.new ? "New" : "Excl"}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    toggleFavorite(game.link);
                  }}
                  className="absolute right-1.5 top-1.5 rounded-full border border-white/10 bg-black/45 p-1.5 text-xs text-white transition hover:border-brand-primary/40 hover:text-brand-accent"
                  aria-label={
                    favoriteLinks.includes(game.link)
                      ? `Remove ${game.name} from favorites`
                      : `Add ${game.name} to favorites`
                  }
                >
                  <FaHeart
                    className={
                      favoriteLinks.includes(game.link)
                        ? "text-brand-primary"
                        : "text-white"
                    }
                  />
                </button>
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <h3 className="truncate text-sm font-bold text-white">
                  {game.name}
                </h3>
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-tertiary">
                  {formatCount(gameLikes(game))}
                  <FaHeart className="text-[10px] text-red-500" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          {activeFilter === "recent"
            ? "No recently played games yet — pick one to get started."
            : "No games in this category yet."}
        </p>
      )}

      <PlatformPanel>
        <LiveWinFeed variant="casino" rows={20} detailed title="Live Casino Wins" />
      </PlatformPanel>
    </PlatformPage>
  );
};

export default CasinoLobby;
