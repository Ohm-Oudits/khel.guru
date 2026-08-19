import { Link } from "react-router-dom";
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
    <div className="px-4 pb-24 pt-6 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(7,23,31,1)_0%,_rgba(11,11,11,1)_58%,_rgba(14,20,31,1)_100%)] p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Support & Trust
          </p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Support, fairness, and safer-play links should always be within
            reach.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-text-secondary">
            Stake treats support, fairness, and responsible gambling as major
            product surfaces. Khel Guru now exposes those same entry points from
            a dedicated top-level page.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {supportLinks.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-background-secondary p-5"
            >
              <item.icon className="text-2xl text-brand-primary" />
              <h2 className="mt-4 text-2xl font-black text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {item.description}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
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
          </div>

          <div className="rounded-[28px] border border-white/10 bg-background-secondary p-6">
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default SupportHub;
