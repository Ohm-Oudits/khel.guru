import { classNames } from "./classNames";

const PlatformPanel = ({ children, className = "" }) => {
  return (
    <section
      className={classNames(
        "surface-enter min-w-0 rounded-[28px] border border-white/10 bg-background-secondary/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur md:p-6",
        className
      )}
    >
      {children}
    </section>
  );
};

export default PlatformPanel;
