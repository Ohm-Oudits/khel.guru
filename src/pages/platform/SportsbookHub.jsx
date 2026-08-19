import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { sportsbookBrowseLinks } from "../../config/platformNavigation";

const SportsbookHub = () => {
  return (
    <PlatformPage>
      <PlatformHero
        eyebrow="Sportsbook"
        title="Cricket-first market discovery with faster entry into live and upcoming action."
        description="The current Khel Guru codebase already has sport-specific pages, but this hub gives them the stronger top-level structure Stake uses: major categories, in-play emphasis, and promotion-led market entry."
        tone="sportsbook"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sportsbookBrowseLinks.map((item) => (
          <PlatformFeatureTile
            key={item.label}
            to={item.path}
            icon={item.icon}
            title={item.label}
            description={item.description}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <PlatformPanel className="xl:col-span-2">
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
                Sports has a dedicated landing hub, category cards, and clearer
                entry points for users comparing us against Stake.
              </p>
            </div>
          </div>
        </PlatformPanel>

        <PlatformPanel>
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
        </PlatformPanel>
      </section>
    </PlatformPage>
  );
};

export default SportsbookHub;
