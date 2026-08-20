import { classNames } from "./classNames";

const toneStyles = {
  emerald: {
    panel:
      "border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(20,241,149,0.24),_transparent_30%),linear-gradient(135deg,_rgba(15,15,15,1)_0%,_rgba(24,24,24,1)_42%,_rgba(9,28,24,1)_100%)]",
    badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    glow: "bg-[radial-gradient(circle_at_center,_rgba(255,215,0,0.14),_transparent_60%)]",
  },
  casino: {
    panel:
      "border-brand-primary/20 bg-[linear-gradient(135deg,_rgba(11,24,22,1)_0%,_rgba(12,12,12,1)_55%,_rgba(33,22,11,1)_100%)]",
    badge: "border-brand-primary/20 bg-brand-primary/10 text-emerald-100",
    glow: "bg-[radial-gradient(circle_at_center,_rgba(0,212,170,0.12),_transparent_60%)]",
  },
  sportsbook: {
    panel:
      "border-blue-400/20 bg-[linear-gradient(135deg,_rgba(8,16,28,1)_0%,_rgba(11,11,11,1)_58%,_rgba(8,29,23,1)_100%)]",
    badge: "border-blue-300/20 bg-blue-400/10 text-blue-100",
    glow: "bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.14),_transparent_60%)]",
  },
  rewards: {
    panel:
      "border-amber-300/20 bg-[linear-gradient(135deg,_rgba(31,22,8,1)_0%,_rgba(11,11,11,1)_62%,_rgba(28,18,7,1)_100%)]",
    badge: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    glow: "bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.14),_transparent_60%)]",
  },
  support: {
    panel:
      "border-cyan-300/20 bg-[linear-gradient(135deg,_rgba(7,23,31,1)_0%,_rgba(11,11,11,1)_58%,_rgba(14,20,31,1)_100%)]",
    badge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    glow: "bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_transparent_60%)]",
  },
  settings: {
    panel:
      "border-white/10 bg-[linear-gradient(135deg,_rgba(22,22,22,1)_0%,_rgba(11,11,11,1)_55%,_rgba(14,26,20,1)_100%)]",
    badge: "border-white/10 bg-white/5 text-white",
    glow: "bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1),_transparent_55%)]",
  },
  wallet: {
    panel:
      "border-emerald-400/20 bg-[linear-gradient(135deg,_rgba(8,30,27,1)_0%,_rgba(11,11,11,1)_65%,_rgba(23,15,8,1)_100%)]",
    badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    glow: "bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.14),_transparent_60%)]",
  },
};

const PlatformHero = ({
  eyebrow,
  title,
  description,
  tone = "emerald",
  actions,
  aside,
  className = "",
}) => {
  const styles = toneStyles[tone] || toneStyles.emerald;

  return (
    <section
      className={classNames(
        "surface-enter relative overflow-hidden rounded-[28px] border p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-7",
        styles.panel,
        className
      )}
    >
      <div
        className={classNames(
          "absolute inset-y-0 right-0 hidden w-1/2 xl:block",
          styles.glow
        )}
      />

      <div
        className={classNames(
          "relative z-10 grid gap-6",
          aside ? "xl:grid-cols-[1.4fr_0.85fr]" : ""
        )}
      >
        <div className="flex flex-col gap-4">
          {eyebrow ? (
            <div
              className={classNames(
                "inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]",
                styles.badge
              )}
            >
              {eyebrow}
            </div>
          ) : null}

          <div className="max-w-2xl">
            <h1 className="text-2xl font-black leading-tight text-white md:text-3xl xl:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm text-text-secondary md:text-base">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {aside ? (
          <div className="grid grid-cols-4 gap-2 xl:grid-cols-2 xl:gap-3">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PlatformHero;
