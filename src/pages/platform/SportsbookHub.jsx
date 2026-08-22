import { useEffect, useMemo, useState } from "react";
import { FaChevronUp, FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import EventCard from "../../components/Sports/EventCard";
import LiveWinFeed from "../../components/platform/LiveWinFeed";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import SwipeRail from "../../components/platform/SwipeRail";
import { titleOfSportGroup } from "../../config/sportsbookGroups";
import { useSportsLiveBoard } from "../../hooks/useSportsLiveBoard";
import { useSportsbookGroups } from "../../hooks/useSportsbookGroups";
import {
  formatLeagueHeading,
  groupEventsByLeague,
} from "../../utils/footballBoard";
import {
  bucketSportsEvents,
  countLiveBySportGroup,
} from "../../utils/sportsEventStatus";
import {
  SPORT_LIKES_KEY,
  applyLikeToggle,
  formatLikeCount,
  likeCountOf,
  readLikesMap,
  writeLikesMap,
} from "../../utils/storedLikes";

const RECENTS_STORAGE_KEY = "kg.recent.sports";
const FAVORITES_STORAGE_KEY = "kg.favorite.sports";

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
    // Ignore storage failures in unsupported environments.
  }
};

// Same tile shape as the home/casino game cards: cover art + favorite toggle
// + name + likes.
const SportCard = ({ sport, likes, onOpen, isFavorite, onToggleFavorite }) => (
  <Link
    to={sport.path}
    onClick={() => onOpen(sport.label)}
    className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
  >
    <div
      className="relative flex aspect-[4/5] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(0,212,170,0.28),_transparent_45%),linear-gradient(180deg,_rgba(8,8,8,0.9),_rgba(18,18,18,1))] bg-cover bg-center"
      style={{
        backgroundImage: `url(${sport.cover || "/sports/default.png"})`,
      }}
    >
      {sport.liveCount > 0 ? (
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          {sport.liveCount} {sport.liveCount === 1 ? "live" : "lives"}
        </span>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onToggleFavorite(sport.label);
        }}
        className="absolute right-1.5 top-1.5 rounded-full border border-white/10 bg-black/45 p-1.5 text-xs text-white transition hover:border-brand-primary/40 hover:text-brand-accent"
        aria-label={
          isFavorite
            ? `Remove ${sport.label} from favorites`
            : `Add ${sport.label} to favorites`
        }
      >
        <FaHeart className={isFavorite ? "text-brand-primary" : "text-white"} />
      </button>
    </div>
    <div className="flex items-center justify-between gap-1 p-2">
      <h3 className="truncate text-sm font-bold text-white">{sport.label}</h3>
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-tertiary">
        {formatLikeCount(likes)}
        <FaHeart className="text-[10px] text-red-500" />
      </span>
    </div>
  </Link>
);

const SportsbookHub = () => {
  const [recentSports, setRecentSports] = useState([]);
  const [favoriteSports, setFavoriteSports] = useState([]);
  const [likesBySport, setLikesBySport] = useState({});
  const sportCards = useSportsbookGroups();
  const { events: boardEvents } = useSportsLiveBoard();
  const [collapsedLeagues, setCollapsedLeagues] = useState({});
  const liveCountBySport = useMemo(
    () => countLiveBySportGroup(boardEvents),
    [boardEvents]
  );
  const { liveBoard, upcomingBoard } = useMemo(() => {
    const buckets = bucketSportsEvents(boardEvents);
    const take = (rows, limit) =>
      rows.filter((event) => event.sportGroup !== "cricket").slice(0, limit);
    return {
      liveBoard: take(buckets.live, 20),
      upcomingBoard: take(buckets.upcoming, 16),
    };
  }, [boardEvents]);

  const likeCount = (label) => likeCountOf(likesBySport, label);

  const sportsByLikes = useMemo(
    () =>
      [...sportCards]
        .map((sport) => ({
          ...sport,
          liveCount: Math.max(
            liveCountBySport[sport.sportKey] || 0,
            sport.liveCount || 0
          ),
        }))
        .sort((a, b) => likeCount(b.label) - likeCount(a.label)),
    [likesBySport, liveCountBySport, sportCards]
  );

  useEffect(() => {
    setRecentSports(safeReadStorage(RECENTS_STORAGE_KEY));
    setFavoriteSports(safeReadStorage(FAVORITES_STORAGE_KEY));
    setLikesBySport(readLikesMap(SPORT_LIKES_KEY));
  }, []);

  const toggleFavoriteSport = (label) => {
    const isLiked = favoriteSports.includes(label);
    const next = isLiked
      ? favoriteSports.filter((entry) => entry !== label)
      : [label, ...favoriteSports];
    const nextLikes = applyLikeToggle(likesBySport, label, isLiked);
    setFavoriteSports(next);
    setLikesBySport(nextLikes);
    safeWriteStorage(FAVORITES_STORAGE_KEY, next);
    writeLikesMap(SPORT_LIKES_KEY, nextLikes);
  };

  const registerRecentSport = (label) => {
    const next = [label, ...recentSports.filter((entry) => entry !== label)].slice(0, 6);
    setRecentSports(next);
    safeWriteStorage(RECENTS_STORAGE_KEY, next);
  };

  const renderSportGrid = (cards) => (
    <SwipeRail label="Sports" rowSize={10}>
      {cards.map((sport) => (
        <SportCard
          key={sport.label}
          sport={sport}
          likes={likeCount(sport.label)}
          onOpen={registerRecentSport}
          isFavorite={favoriteSports.includes(sport.label)}
          onToggleFavorite={toggleFavoriteSport}
        />
      ))}
    </SwipeRail>
  );

  const toggleLeague = (key) =>
    setCollapsedLeagues((current) => ({
      ...current,
      [key]: !current[key],
    }));

  const renderLeagueBoard = (rows) =>
    groupEventsByLeague(rows, { includeSport: true }).map(
      ({ key, league, sport, events }) => {
        const collapsed = Boolean(collapsedLeagues[key]);
        return (
          <section
            key={key}
            className="overflow-hidden rounded-xl border border-white/5 bg-background-tertiary"
          >
            <button
              type="button"
              onClick={() => toggleLeague(key)}
              className="flex w-full items-center justify-between gap-3 border-b border-white/5 bg-background-secondary px-3 py-2.5 text-left sm:px-4"
            >
              <h3 className="min-w-0 truncate text-sm font-semibold text-text-primary">
                {titleOfSportGroup(sport)} · {formatLeagueHeading(league)}
              </h3>
              <FaChevronUp
                className={`shrink-0 text-xs text-text-tertiary transition-transform ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
            {collapsed ? null : (
              <div className="divide-y divide-white/5">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            )}
          </section>
        );
      }
    );

  return (
    <PlatformPage>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black text-white">Sports</h1>
      </div>

      <div
        role="list"
        aria-label="Browse sports"
        className="scrollbar-hide flex gap-2 overflow-x-auto pb-1"
      >
        {sportsByLikes.map((sport) => (
          <Link
            key={sport.sportKey}
            role="listitem"
            to={sport.path}
            onClick={() => registerRecentSport(sport.label)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-background-tertiary px-3 py-1.5 text-sm text-text-primary transition hover:border-brand-primary/40"
          >
            <img
              src={sport.cover || "/sports/default.png"}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
            <span className="whitespace-nowrap font-medium">{sport.label}</span>
            {sport.liveCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-interactive-error">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                {sport.liveCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {renderSportGrid(sportsByLikes)}

      {liveBoard.length ? (
        <PlatformPanel>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">In-play</h2>
            <span className="text-xs font-semibold text-interactive-error">
              {liveBoard.length} live
            </span>
          </div>
          <div className="space-y-3">{renderLeagueBoard(liveBoard)}</div>
        </PlatformPanel>
      ) : null}

      {upcomingBoard.length ? (
        <PlatformPanel>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">Starting soon</h2>
            <span className="text-xs font-semibold text-text-tertiary">
              {upcomingBoard.length} events
            </span>
          </div>
          <div className="space-y-3">{renderLeagueBoard(upcomingBoard)}</div>
        </PlatformPanel>
      ) : null}

      <PlatformPanel>
        <LiveWinFeed variant="sports" rows={20} detailed title="Bet Rolls" />
      </PlatformPanel>
    </PlatformPage>
  );
};

export default SportsbookHub;
