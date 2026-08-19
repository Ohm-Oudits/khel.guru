import { Link, useNavigate } from "react-router-dom";
import { originals, wins } from "../../constants";
import {
  casinoBrowseLinks,
  heroMetrics,
  rewardPrograms,
  sportsbookBrowseLinks,
  stakeComparisonChecklist,
  supportLinks,
} from "../../config/platformNavigation";

const featuredGames = originals.slice(0, 8);
const featuredWins = wins.slice(0, 6);

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 pb-24 pt-6 text-text-primary md:px-6 xl:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[32px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(20,241,149,0.28),_transparent_28%),linear-gradient(135deg,_rgba(15,15,15,1)_0%,_rgba(24,24,24,1)_42%,_rgba(9,28,24,1)_100%)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,215,0,0.14),_transparent_60%)] xl:block" />
          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="flex flex-col gap-5">
              <div className="inline-flex w-fit items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                Stake-style benchmark, Khel Guru build
              </div>
              <div className="max-w-3xl">
                <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">
                  Home, casino, sports, rewards, support, and wallet in one
                  premium shell.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-text-secondary md:text-lg">
                  This phase rebuilds Khel Guru around the exact product
                  surfaces we need to compare against Stake: fast browse, strong
                  category entry points, visible rewards, and support that is
                  not buried.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
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
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {heroMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Link
            to="/casino"
            className="rounded-[28px] border border-white/10 bg-background-secondary p-6 transition hover:-translate-y-1 hover:border-brand-primary/40"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Casino
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              Originals-first browse
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Trending games, live tables, quick entry points, and curated
              sections.
            </p>
          </Link>

          <Link
            to="/sports"
            className="rounded-[28px] border border-white/10 bg-background-secondary p-6 transition hover:-translate-y-1 hover:border-brand-primary/40"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Sports
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              India-first event flow
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Cricket-led markets plus football, tennis, and fast in-play
              discovery.
            </p>
          </Link>

          <Link
            to="/rewards"
            className="rounded-[28px] border border-white/10 bg-background-secondary p-6 transition hover:-translate-y-1 hover:border-brand-primary/40"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Rewards
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              VIP and promos up front
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              The loyalty layer is now a top-level product area rather than an
              afterthought.
            </p>
          </Link>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
                Compare Against Stake
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Phase 01 benchmark checklist
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-text-secondary">
              Snapshot date: August 19, 2026
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {stakeComparisonChecklist.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-emerald-400/15 bg-black/20 p-4"
              >
                <p className="text-sm font-semibold text-emerald-200">
                  0{index + 1}
                </p>
                <p className="mt-2 text-sm text-text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
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
          </div>

          <div className="flex flex-col gap-8">
            <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
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
            </div>

            <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
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
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6 xl:col-span-1">
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
          </div>

          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6 xl:col-span-1">
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
          </div>

          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6 xl:col-span-1">
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
