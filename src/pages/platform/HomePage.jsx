import { useEffect, useMemo, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import LiveWinFeed from "../../components/platform/LiveWinFeed";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import SwipeRail from "../../components/platform/SwipeRail";
import { originals } from "../../constants";
import {
  casinoBrowseLinks,
  heroMetrics,
  rewardPrograms,
  supportLinks,
} from "../../config/platformNavigation";
import { useSportsbookGroups } from "../../hooks/useSportsbookGroups";
import {
  GAME_LIKES_KEY,
  SPORT_LIKES_KEY,
  applyLikeToggle,
  formatLikeCount,
  likeCountOf,
  readLikesMap,
  writeLikesMap,
} from "../../utils/storedLikes";

const GAME_FAVORITES_KEY = "kg.favorite.originals";
const SPORT_FAVORITES_KEY = "kg.favorite.sports";
const TOP_SECTION_LIMIT = 10;

const safeReadList = (key) => {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWriteList = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures in unsupported environments.
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const [gameLikes, setGameLikes] = useState({});
  const [sportLikes, setSportLikes] = useState({});
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [favoriteSports, setFavoriteSports] = useState([]);
  const featuredSports = useSportsbookGroups();

  useEffect(() => {
    setGameLikes(readLikesMap(GAME_LIKES_KEY));
    setSportLikes(readLikesMap(SPORT_LIKES_KEY));
    setFavoriteGames(safeReadList(GAME_FAVORITES_KEY));
    setFavoriteSports(safeReadList(SPORT_FAVORITES_KEY));
  }, []);

  const rankedOriginals = useMemo(
    () =>
      [...originals].sort(
        (a, b) => likeCountOf(gameLikes, b.link) - likeCountOf(gameLikes, a.link)
      ),
    [gameLikes]
  );
  const rankedSports = useMemo(
    () =>
      [...featuredSports].sort(
        (a, b) =>
          likeCountOf(sportLikes, b.label) - likeCountOf(sportLikes, a.label)
      ),
    [featuredSports, sportLikes]
  );

  const topOriginals = rankedOriginals.slice(0, TOP_SECTION_LIMIT);
  const topSports = rankedSports.slice(0, TOP_SECTION_LIMIT);
  const hasMoreOriginals = rankedOriginals.length > TOP_SECTION_LIMIT;
  const hasMoreSports = rankedSports.length > TOP_SECTION_LIMIT;

  const toggleGameLike = (event, link) => {
    event.preventDefault();
    event.stopPropagation();
    const isLiked = favoriteGames.includes(link);
    const nextFavorites = isLiked
      ? favoriteGames.filter((entry) => entry !== link)
      : [link, ...favoriteGames].slice(0, 12);
    const nextLikes = applyLikeToggle(gameLikes, link, isLiked);
    setFavoriteGames(nextFavorites);
    setGameLikes(nextLikes);
    safeWriteList(GAME_FAVORITES_KEY, nextFavorites);
    writeLikesMap(GAME_LIKES_KEY, nextLikes);
  };

  const toggleSportLike = (event, label) => {
    event.preventDefault();
    event.stopPropagation();
    const isLiked = favoriteSports.includes(label);
    const nextFavorites = isLiked
      ? favoriteSports.filter((entry) => entry !== label)
      : [label, ...favoriteSports];
    const nextLikes = applyLikeToggle(sportLikes, label, isLiked);
    setFavoriteSports(nextFavorites);
    setSportLikes(nextLikes);
    safeWriteList(SPORT_FAVORITES_KEY, nextFavorites);
    writeLikesMap(SPORT_LIKES_KEY, nextLikes);
  };

  return (
    <PlatformPage className="text-text-primary">
      <PlatformHero
        eyebrow="Khel Guru"
        hideEyebrowOnMobile
        title="Casino & sportsbook in one premium shell."
        description="Fast browse, strong category entry points, visible rewards, and support that is not buried."
        tone="emerald"
        actions={
          <>
            <button
              className="rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-text-inverse transition hover:bg-interactive-primaryHover xl:rounded-2xl xl:px-5 xl:py-3 xl:text-sm"
              onClick={() => navigate("/casino")}
            >
              Enter Casino
            </button>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 xl:rounded-2xl xl:px-5 xl:py-3 xl:text-sm"
              onClick={() => navigate("/sports")}
            >
              Browse Sports
            </button>
          </>
        }
        aside={heroMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-white/10 bg-black/25 p-2 backdrop-blur xl:rounded-3xl xl:p-4"
          >
            <p className="text-[9px] uppercase tracking-[0.14em] text-text-tertiary xl:text-xs xl:tracking-[0.22em]">
              {metric.label}
            </p>
            <p className="mt-1 text-sm font-bold text-white xl:mt-2 xl:text-2xl">
              {metric.value}
            </p>
          </div>
        ))}
      />

      <section className="hidden gap-4 lg:grid lg:grid-cols-3">
        <PlatformFeatureTile
          to="/casino"
          eyebrow="Casino"
          title="Originals-first browse"
          description="Trending games, live tables, quick entry points, and curated sections."
          className="p-6"
        />
        <PlatformFeatureTile
          to="/sports"
          eyebrow="Sports"
          title="India-first event flow"
          description="Cricket-first boards plus football, tennis, NBA, NFL, and live in-play discovery."
          className="p-6"
        />
        <PlatformFeatureTile
          to="/rewards"
          eyebrow="Rewards"
          title="VIP and promos up front"
          description="The loyalty layer is now a top-level product area rather than an afterthought."
          className="p-6"
        />
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[1.75fr_0.7fr]">
        <PlatformPanel>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Trending
          </p>

          <div className="mt-2 md:mt-5">
            <h2 className="text-xl font-black leading-tight text-white md:text-2xl">
              Top Originals
            </h2>
            <SwipeRail
              alwaysSwipe
              contained
              label="Top originals"
              moreTo="/casino"
              moreLabel="See all"
              hasMore={hasMoreOriginals}
              itemClassName="w-[30vw] sm:w-[22vw] lg:w-[18%] xl:w-[14%]"
              className="mt-2 md:mt-3"
            >
              {topOriginals.map((game) => (
                <Link
                  key={game.link}
                  to={game.link}
                  className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
                >
                  <div
                    className="aspect-[4/5] bg-cover bg-center"
                    style={{ backgroundImage: `url(${game.img})` }}
                  />
                  <div className="flex items-center justify-between gap-1 p-2">
                    <h3 className="truncate text-sm font-bold text-white">
                      {game.name}
                    </h3>
                    <button
                      type="button"
                      onClick={(event) => toggleGameLike(event, game.link)}
                      className="flex shrink-0 items-center gap-1 text-[11px] text-text-tertiary"
                      aria-label={
                        favoriteGames.includes(game.link)
                          ? `Unlike ${game.name}`
                          : `Like ${game.name}`
                      }
                    >
                      {formatLikeCount(likeCountOf(gameLikes, game.link))}
                      <FaHeart
                        className={`text-[10px] ${
                          favoriteGames.includes(game.link)
                            ? "text-brand-primary"
                            : "text-red-500"
                        }`}
                      />
                    </button>
                  </div>
                </Link>
              ))}
            </SwipeRail>
          </div>

          <div className="mt-3 md:mt-6">
            <h2 className="text-xl font-black leading-tight text-white md:text-2xl">
              Top Sports
            </h2>
            <SwipeRail
              alwaysSwipe
              contained
              label="Top sports"
              moreTo="/sports"
              moreLabel="See all"
              hasMore={hasMoreSports}
              itemClassName="w-[30vw] sm:w-[22vw] lg:w-[18%] xl:w-[14%]"
              className="mt-2 md:mt-3"
            >
              {topSports.map((sport) => (
                  <Link
                    key={sport.label}
                    to={sport.path}
                    className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
                  >
                    <div
                      className="flex aspect-[4/5] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(0,212,170,0.25),_transparent_55%),linear-gradient(180deg,_rgba(8,8,8,0.9),_rgba(18,18,18,1))] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${sport.cover || "/sports/default.png"})`,
                      }}
                    >
                    </div>
                    <div className="flex items-center justify-between gap-1 p-2">
                      <h3 className="truncate text-sm font-bold text-white">
                        {sport.label}
                      </h3>
                      <button
                        type="button"
                        onClick={(event) => toggleSportLike(event, sport.label)}
                        className="flex shrink-0 items-center gap-1 text-[11px] text-text-tertiary"
                        aria-label={
                          favoriteSports.includes(sport.label)
                            ? `Unlike ${sport.label}`
                            : `Like ${sport.label}`
                        }
                      >
                        {formatLikeCount(likeCountOf(sportLikes, sport.label))}
                        <FaHeart
                          className={`text-[10px] ${
                            favoriteSports.includes(sport.label)
                              ? "text-brand-primary"
                              : "text-red-500"
                          }`}
                        />
                      </button>
                    </div>
                  </Link>
              ))}
            </SwipeRail>
          </div>
        </PlatformPanel>

        <PlatformPanel>
          <LiveWinFeed variant="both" fill rows={20} title="Bet Rolls" />
        </PlatformPanel>
      </section>

      <section className="grid gap-8 xl:grid-cols-3">
        <PlatformPanel className="xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Casino Browse
          </p>
          <div className="mt-5 grid gap-3">
            {casinoBrowseLinks.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-brand-primary/40"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="text-xl text-brand-primary" />
                  <div>
                    <p className="font-bold text-white">{item.label}</p>
                    <p className="text-xs text-text-tertiary">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </PlatformPanel>

        <PlatformPanel className="xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Rewards Surface
          </p>
          <div className="mt-5 grid gap-3">
            {rewardPrograms.map((program) => (
              <Link
                key={program.title}
                to="/rewards"
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-brand-primary/40"
              >
                <div className="flex items-center gap-3">
                  <program.icon className="text-xl text-brand-primary" />
                  <div>
                    <p className="font-bold text-white">{program.title}</p>
                    <p className="text-xs text-text-tertiary">
                      {program.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </PlatformPanel>

        <PlatformPanel className="xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Support Surface
          </p>
          <div className="mt-5 grid gap-3">
            {supportLinks.map((item) => (
              <Link
                key={item.title}
                to="/support"
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-brand-primary/40"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="text-xl text-brand-primary" />
                  <div>
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="text-xs text-text-tertiary">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </PlatformPanel>
      </section>
    </PlatformPage>
  );
};

export default HomePage;
