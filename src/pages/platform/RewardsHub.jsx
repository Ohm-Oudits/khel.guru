import { Link } from "react-router-dom";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { rewardPrograms } from "../../config/platformNavigation";

const RewardsHub = () => {
  return (
    <PlatformPage>
      <PlatformHero
        eyebrow="Rewards & VIP"
        title="Promotions and loyalty are now a first-class destination."
        description="Stake keeps VIP, rakeback, and bonus education highly visible. This hub gives Khel Guru the same structural surface before the rewards engine is fully implemented."
        tone="rewards"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rewardPrograms.map((program) => (
          <PlatformFeatureTile
            key={program.title}
            icon={program.icon}
            title={program.title}
            description={program.description}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <PlatformPanel className="xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Why this matters
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Rewards should not hide behind profile dropdowns
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            Moving Rewards into the top navigation brings Khel Guru much closer
            to Stake&apos;s product posture: players can immediately see where
            VIP, bonuses, and promotional entry points live.
          </p>
        </PlatformPanel>

        <PlatformPanel>
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
        </PlatformPanel>
      </section>
    </PlatformPage>
  );
};

export default RewardsHub;
