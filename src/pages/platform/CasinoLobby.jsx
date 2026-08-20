import { useDeferredValue, useEffect, useState } from "react";
import { FaHeart, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { originals } from "../../constants";

const FAVORITES_STORAGE_KEY = "kg.favorite.originals";
const RECENTS_STORAGE_KEY = "kg.recent.originals";

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

const buildGameCollections = ({ games, favorites, recents }) => {
  const favoriteGames = games.filter((game) => favorites.includes(game.link));
  const recentGames = recents
    .map((link) => games.find((game) => game.link === link))
    .filter(Boolean);

  return [
    {
      title: "Trending Now",
      description: "Fast-entry originals and table games that anchor repeat play.",
      games: games.slice(0, 8),
    },
    {
      title: "Only on Khel Guru",
      description: "Exclusive in-house titles deserve a dedicated product shelf.",
      games: games.filter((game) => game.exclusive),
    },
    {
      title: "Fresh Picks",
      description: "New or highlighted games surfaced before they get buried in the grid.",
      games: games.filter((game) => game.new),
    },
    {
      title: "Favorites",
      description: "Quick return path for the games players mark intentionally.",
      games: favoriteGames,
    },
    {
      title: "Recently Played",
      description: "A simple recovery shelf until shared session round history goes live.",
      games: recentGames,
    },
  ].filter((section) => section.games.length);
};

const CasinoLobby = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteLinks, setFavoriteLinks] = useState([]);
  const [recentLinks, setRecentLinks] = useState([]);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setFavoriteLinks(safeReadStorage(FAVORITES_STORAGE_KEY));
    setRecentLinks(safeReadStorage(RECENTS_STORAGE_KEY));
  }, []);

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredGames = originals.filter((game) =>
    normalizedQuery
      ? [game.name, game.creator]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      : true
  );

  const sections = buildGameCollections({
    games: filteredGames,
    favorites: favoriteLinks,
    recents: recentLinks,
  });

  const toggleFavorite = (link) => {
    const nextFavorites = favoriteLinks.includes(link)
      ? favoriteLinks.filter((entry) => entry !== link)
      : [link, ...favoriteLinks].slice(0, 12);

    setFavoriteLinks(nextFavorites);
    safeWriteStorage(FAVORITES_STORAGE_KEY, nextFavorites);
  };

  const registerRecentGame = (link) => {
    const nextRecents = [link, ...recentLinks.filter((entry) => entry !== link)].slice(
      0,
      8
    );

    setRecentLinks(nextRecents);
    safeWriteStorage(RECENTS_STORAGE_KEY, nextRecents);
  };

  return (
    <PlatformPage>
      <PlatformPanel>
        <label className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <FaSearch className="text-text-tertiary" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search originals, tables, or creators"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-text-tertiary"
          />
        </label>
      </PlatformPanel>

      {sections.map((section) => (
        <PlatformPanel key={section.title}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
                Catalog Section
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {section.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {section.description}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {section.games.map((game) => (
              <Link
                key={`${section.title}-${game.name}`}
                to={game.link}
                onClick={() => registerRecentGame(game.link)}
                className="group overflow-hidden rounded-[24px] border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
              >
                <div
                  className="relative aspect-[4/5] bg-background-secondary"
                  style={
                    game.img
                      ? { backgroundImage: `url(${game.img})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                >
                  {!game.img ? (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,212,170,0.28),_transparent_42%),linear-gradient(180deg,_rgba(8,8,8,0.9),_rgba(18,18,18,1))]" />
                  ) : null}
                  <div className="absolute left-3 top-3 flex gap-2">
                    {game.exclusive ? (
                      <span className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                        Exclusive
                      </span>
                    ) : null}
                    {game.new ? (
                      <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">
                        New
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      toggleFavorite(game.link);
                    }}
                    className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 p-2 text-white transition hover:border-brand-primary/40 hover:text-brand-accent"
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
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    {favoriteLinks.includes(game.link)
                      ? "Favorited"
                      : game.exclusive
                      ? "Exclusive"
                      : "Ready to play"}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-white">
                    {game.name}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {game.creator}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </PlatformPanel>
      ))}

      {!sections.length ? (
        <PlatformPanel>
          <h2 className="text-2xl font-black text-white">No games matched that search</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Try a different keyword like Crash, Dice, or Blackjack to jump back into
            the lobby catalog.
          </p>
        </PlatformPanel>
      ) : null}
    </PlatformPage>
  );
};

export default CasinoLobby;
