import { Link } from "react-router-dom";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { supportLinks } from "../../config/platformNavigation";

const supportTopics = [
  "Help Center",
  "Fairness",
  "Responsible Gaming",
  "Self Exclusion",
  "Live Support",
  "Payment Guidance",
];

const SupportHub = () => {
  return (
    <PlatformPage>
      <PlatformHero
        eyebrow="Support & Trust"
        title="Support, fairness, and safer-play links should always be within reach."
        description="Stake treats support, fairness, and responsible gambling as major product surfaces. Khel Guru now exposes those same entry points from a dedicated top-level page."
        tone="support"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {supportLinks.map((item) => (
          <PlatformFeatureTile
            key={item.title}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PlatformPanel>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Support topics
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {supportTopics.map((topic) => (
              <div
                key={topic}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white"
              >
                {topic}
              </div>
            ))}
          </div>
        </PlatformPanel>

        <PlatformPanel>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Linked product areas
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Trust should connect to wallet and settings
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            Fairness, self-exclusion, and account protection are easier to
            discover once Support sits next to Wallet and Settings in the main
            navigation.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/wallet"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Open Wallet
            </Link>
            <Link
              to="/settings"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Open Settings
            </Link>
          </div>
        </PlatformPanel>
      </section>
    </PlatformPage>
  );
};

export default SupportHub;
