import { FaHeart } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import LiveWinFeed from "../../components/platform/LiveWinFeed";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { originals } from "../../constants";
import {
  casinoBrowseLinks,
  heroMetrics,
  rewardPrograms,
  sportsbookBrowseLinks,
  supportLinks,
} from "../../config/platformNavigation";

const featuredSports = sportsbookBrowseLinks.slice(0, 4);

const gameLikes = (game) => {
  const seed = String(game.name)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), game.id || 0);
  return 4200 + (seed * 733) % 95000;
};

const sportLikes = (sport) => {
  const seed = String(sport.label)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 6100 + (seed * 911) % 88000;
};

const formatCount = (count) =>
  count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);

const trendingItems = [
  ...originals.map((game) => ({
    kind: "game",
    key: game.link,
    likes: gameLikes(game),
    game,
  })),
  ...featuredSports.map((sport) => ({
    kind: "sport",
    key: sport.label,
    likes: sportLikes(sport),
    sport,
  })),
]
  .sort((a, b) => b.likes - a.likes)
  .slice(0, 10);

const HomePage = () => {
  const navigate = useNavigate();

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
          description="Cricket-led markets plus football, tennis, and fast in-play discovery."
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

      <section className="grid gap-6 xl:grid-cols-[1.75fr_0.7fr]">
        <PlatformPanel>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Trending
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white md:text-3xl xl:text-4xl">
              Top games and sports
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {trendingItems.map((item) => {
              if (item.kind === "game") {
                return (
                  <Link
                    key={item.key}
                    to={item.game.link}
                    className="group overflow-hidden rounded-[20px] border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
                  >
                    <div
                      className="aspect-[4/5] bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.game.img})` }}
                    />
                    <div className="flex items-center justify-between gap-1 p-2">
                      <h3 className="truncate text-sm font-bold text-white">
                        {item.game.name}
                      </h3>
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-tertiary">
                        {formatCount(item.likes)}
                        <FaHeart className="text-[10px] text-red-500" />
                      </span>
                    </div>
                  </Link>
                );
              }

              const SportIcon = item.sport.icon;
              return (
                <Link
                  key={item.key}
                  to={item.sport.path}
                  className="group overflow-hidden rounded-[20px] border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
                >
                  <div className="flex aspect-[4/5] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(0,212,170,0.25),_transparent_55%),linear-gradient(180deg,_rgba(8,8,8,0.9),_rgba(18,18,18,1))]">
                    <SportIcon className="text-4xl text-brand-primary" />
                  </div>
                  <div className="flex items-center justify-between gap-1 p-2">
                    <h3 className="truncate text-sm font-bold text-white">
                      {item.sport.label}
                    </h3>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-tertiary">
                      {formatCount(item.likes)}
                      <FaHeart className="text-[10px] text-red-500" />
                    </span>
                  </div>
                </Link>
              );
            })}
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
