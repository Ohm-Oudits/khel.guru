import { Link, useLocation } from "react-router-dom";
import {
  isNavigationActive,
  mobileNavigation,
} from "../../config/platformNavigation";

const Footer = () => {
  const location = useLocation();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] xl:hidden">
      <div className="pointer-events-auto relative w-full max-w-[360px]">
        <div className="absolute inset-x-12 bottom-1 h-9 rounded-full bg-brand-primary/16 blur-2xl" />
        <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,_rgba(24,30,28,0.78)_0%,_rgba(12,16,15,0.92)_100%)] px-2 py-1 shadow-[0_20px_48px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
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
                  className={`group relative flex min-h-[42px] items-center justify-center rounded-[20px] px-1 py-1 transition duration-300 ${
                    active
                      ? "-translate-y-0.5"
                      : "text-text-tertiary hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute inset-x-1 inset-y-0.5 rounded-[18px] transition duration-300 ${
                      active
                        ? "bg-white/[0.045] opacity-100"
                        : "opacity-0 group-hover:bg-white/[0.03] group-hover:opacity-100"
                    }`}
                  />
                  <span
                    className={`relative flex items-center justify-center rounded-[16px] transition duration-300 ${
                      isHome ? "h-[42px] w-[42px]" : "h-[34px] w-[34px]"
                    } ${
                      active
                        ? "bg-[linear-gradient(180deg,_rgba(25,214,182,0.92)_0%,_rgba(17,167,145,0.82)_100%)] text-text-inverse shadow-[0_10px_22px_rgba(15,199,170,0.24)]"
                        : "bg-white/[0.025] text-white/72 group-hover:bg-white/[0.05] group-hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={isHome ? "text-[17px]" : "text-[15px]"}
                    />
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
