import { Link } from "react-router-dom";
import { rewardPrograms } from "../../config/platformNavigation";

const RewardsHub = () => {
  return (
    <div className="px-4 pb-24 pt-6 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-amber-300/20 bg-[linear-gradient(135deg,_rgba(31,22,8,1)_0%,_rgba(11,11,11,1)_62%,_rgba(28,18,7,1)_100%)] p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Rewards & VIP
          </p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Promotions and loyalty are now a first-class destination.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-text-secondary">
            Stake keeps VIP, rakeback, and bonus education highly visible. This
            hub gives Khel Guru the same structural surface before the rewards
            engine is fully implemented.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rewardPrograms.map((program) => (
            <div
              key={program.title}
              className="rounded-[28px] border border-white/10 bg-background-secondary p-5"
            >
              <program.icon className="text-2xl text-brand-primary" />
              <h2 className="mt-4 text-2xl font-black text-white">
                {program.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {program.description}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6 xl:col-span-2">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Why this matters
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Rewards should not hide behind profile dropdowns
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              Moving Rewards into the top navigation brings Khel Guru much
              closer to Stake&apos;s product posture: players can immediately see
              where VIP, bonuses, and promotional entry points live.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Next phase
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Engine work later
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              Rakeback, reloads, races, raffles, and tier progression are the
              focus of prompt 14. This page establishes the information
              architecture now.
            </p>
            <Link
              to="/support"
              className="mt-5 inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              See support surface
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RewardsHub;
