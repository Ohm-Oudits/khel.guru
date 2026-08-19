import { classNames } from "./classNames";

const PlatformPanel = ({ children, className = "" }) => {
  return (
    <section
      className={classNames(
        "surface-enter rounded-[28px] border border-white/10 bg-background-secondary/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur",
        className
      )}
    >
      {children}
    </section>
  );
};

export default PlatformPanel;
