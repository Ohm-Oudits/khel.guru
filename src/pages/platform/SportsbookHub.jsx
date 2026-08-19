import { Link } from "react-router-dom";
import { sportsbookBrowseLinks } from "../../config/platformNavigation";

const SportsbookHub = () => {
  return (
    <div className="px-4 pb-24 pt-6 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-blue-400/20 bg-[linear-gradient(135deg,_rgba(8,16,28,1)_0%,_rgba(11,11,11,1)_58%,_rgba(8,29,23,1)_100%)] p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Sportsbook
          </p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Cricket-first market discovery with faster entry into live and
            upcoming action.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-text-secondary">
            The current Khel Guru codebase already has sport-specific pages, but
            this hub gives them the stronger top-level structure Stake uses:
            major categories, in-play emphasis, and promotion-led market entry.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sportsbookBrowseLinks.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="rounded-[28px] border border-white/10 bg-background-secondary p-5 transition hover:-translate-y-1 hover:border-brand-primary/40"
            >
              <item.icon className="text-2xl text-brand-primary" />
              <h2 className="mt-4 text-2xl font-black text-white">
                {item.label}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {item.description}
              </p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6 xl:col-span-2">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              What changed
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Sports is now a real top-level product surface
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">Before</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Sports existed mostly as deep pages and route branches.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">Now</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Sports has a dedicated landing hub, category cards, and
                  clearer entry points for users comparing us against Stake.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Launch Bias
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">Cricket</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  First-class route and positioning for India-first launch.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">In-play</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Future odds and live-state work will anchor here.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">Promotions</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Reward-led market surfacing is now part of the shell.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SportsbookHub;
