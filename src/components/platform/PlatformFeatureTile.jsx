import { Link } from "react-router-dom";
import { classNames } from "./classNames";

const PlatformFeatureTile = ({
  title,
  description,
  eyebrow,
  icon: Icon,
  to,
  className = "",
}) => {
  const Component = to ? Link : "div";

  return (
    <Component
      to={to}
      className={classNames(
        "surface-enter rounded-[28px] border border-white/10 bg-background-secondary/95 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.14)] backdrop-blur transition",
        to && "hover:-translate-y-1 hover:border-brand-primary/40",
        className
      )}
    >
      {Icon ? <Icon className="text-2xl text-brand-primary" /> : null}
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={classNames(
          "text-2xl font-black text-white",
          Icon || eyebrow ? "mt-4" : ""
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
      ) : null}
    </Component>
  );
};

export default PlatformFeatureTile;
