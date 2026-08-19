import { Link, useLocation } from "react-router-dom";
import {
  isNavigationActive,
  mobileNavigation,
} from "../../config/platformNavigation";

const Footer = () => {
  const location = useLocation();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] xl:hidden">
      <div className="pointer-events-auto relative w-full max-w-[420px]">
        <div className="absolute inset-x-10 bottom-1 h-12 rounded-full bg-brand-primary/20 blur-2xl" />
        <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,_rgba(24,30,28,0.82)_0%,_rgba(12,16,15,0.94)_100%)] px-2 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/18" />
          <div className="grid grid-cols-5 items-center gap-1">
            {mobileNavigation.map((item) => {
              const active = isNavigationActive(item, location.pathname);
              const isHome = item.label === "Home";

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  aria-label={item.label}
                  title={item.label}
                  className={`group relative flex min-h-[56px] items-center justify-center rounded-[24px] px-1.5 py-2 transition duration-300 ${
                    active
                      ? "-translate-y-1"
                      : "text-text-tertiary hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute inset-x-1 inset-y-1 rounded-[22px] transition duration-300 ${
                      active
                        ? "bg-white/[0.06] opacity-100"
                        : "opacity-0 group-hover:bg-white/[0.04] group-hover:opacity-100"
                    }`}
                  />
                  <span
                    className={`relative flex items-center justify-center rounded-[18px] transition duration-300 ${
                      isHome ? "h-12 w-12" : "h-10 w-10"
                    } ${
                      active
                        ? "bg-[linear-gradient(180deg,_rgba(25,214,182,0.9)_0%,_rgba(17,167,145,0.82)_100%)] text-text-inverse shadow-[0_12px_26px_rgba(15,199,170,0.28)]"
                        : "bg-white/[0.04] text-white/72 group-hover:bg-white/[0.08] group-hover:text-white"
                    }`}
                  >
                    <item.icon className={isHome ? "text-lg" : "text-base"} />
                  </span>
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
