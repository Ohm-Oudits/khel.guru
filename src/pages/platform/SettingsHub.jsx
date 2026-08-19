import { Link } from "react-router-dom";
import { settingsSections } from "../../config/platformNavigation";

const SettingsHub = () => {
  return (
    <div className="px-4 pb-24 pt-6 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,_rgba(22,22,22,1)_0%,_rgba(11,11,11,1)_55%,_rgba(14,26,20,1)_100%)] p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Settings
          </p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Security, preferences, sessions, and verification from one top-level
            account hub.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-text-secondary">
            Stake keeps account control easy to locate. Khel Guru now has a
            proper Settings landing page that points into the deeper account
            subsections already present in the codebase.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settingsSections.map((section) => (
            <Link
              key={section.title}
              to={section.path}
              className="rounded-[28px] border border-white/10 bg-background-secondary p-5 transition hover:-translate-y-1 hover:border-brand-primary/40"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
                Settings section
              </p>
              <h2 className="mt-4 text-2xl font-black text-white">
                {section.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {section.description}
              </p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
};

export default SettingsHub;
