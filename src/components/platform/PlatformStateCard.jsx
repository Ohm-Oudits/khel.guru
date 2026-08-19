import PlatformPanel from "./PlatformPanel";

const PlatformStateCard = ({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
}) => {
  return (
    <PlatformPanel className={className}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          {description}
        </p>
      ) : null}
      {children}
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </PlatformPanel>
  );
};

export default PlatformStateCard;
