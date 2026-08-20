import { Link, useNavigate } from "react-router-dom";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { originals, wins } from "../../constants";
import {
  casinoBrowseLinks,
  heroMetrics,
  rewardPrograms,
  sportsbookBrowseLinks,
  supportLinks,
} from "../../config/platformNavigation";

const featuredGames = originals.slice(0, 8);
const featuredWins = wins.slice(0, 6);

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <PlatformPage className="text-text-primary">
      <PlatformHero
        eyebrow="Stake-style benchmark, Khel Guru build"
        title="Home, casino, sports, rewards, support, and wallet in one premium shell."
        description="This phase rebuilds Khel Guru around the exact product surfaces we need to compare against Stake: fast browse, strong category entry points, visible rewards, and support that is not buried."
        tone="emerald"
        actions={
          <>
            <button
              className="rounded-2xl bg-brand-primary px-5 py-3 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover"
              onClick={() => navigate("/casino")}
            >
              Enter Casino
            </button>
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              onClick={() => navigate("/sports")}
            >
              Browse Sports
            </button>
            <button
              className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-sm font-bold text-text-secondary transition hover:border-emerald-300/30 hover:text-white"
              onClick={() => navigate("/?tab=register")}
            >
              Open Register Flow
            </button>
          </>
        }
        aside={heroMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
          </div>
        ))}
      />

      <section className="grid gap-4 lg:grid-cols-3">
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

      <section className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
        <PlatformPanel>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
                Trending Games
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Fast entry into Khel Guru originals
              </h2>
            </div>
            <Link
              to="/casino"
              className="text-sm font-semibold text-brand-primary transition hover:text-white"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featuredGames.map((game) => (
              <Link
                key={`${game.name}-${game.link}`}
                to={game.link}
                className="group overflow-hidden rounded-[24px] border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
              >
                <div
                  className="aspect-[4/5] bg-cover bg-center"
                  style={{ backgroundImage: `url(${game.img})` }}
                />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    {game.exclusive ? "Exclusive" : "Ready to play"}
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

        <div className="flex flex-col gap-8">
          <PlatformPanel>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Trending Sports
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Sports entry points
            </h2>
            <div className="mt-5 grid gap-3">
              {sportsbookBrowseLinks.slice(0, 4).map((sport) => (
                <Link
                  key={sport.label}
                  to={sport.path}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-brand-primary/40 hover:bg-black/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {sport.label}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {sport.description}
                      </p>
                    </div>
                    <sport.icon className="text-xl text-brand-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </PlatformPanel>

          <PlatformPanel>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Live Feed
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Win stream preview
            </h2>
            <div className="mt-4 space-y-3">
              {featuredWins.map((entry) => (
                <div
                  key={`${entry.username}-${entry.game}-${entry.time}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {entry.username} on {entry.game}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {entry.time} • {entry.multiplier}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand-primary">
                    {entry.payout}
                  </span>
                </div>
              ))}
            </div>
          </PlatformPanel>
        </div>
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
