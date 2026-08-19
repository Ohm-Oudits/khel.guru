import { Link, useLocation } from "react-router-dom";
import {
  isNavigationActive,
  mobileNavigation,
} from "../../config/platformNavigation";

const Footer = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-[linear-gradient(180deg,_rgba(9,13,11,0.9)_0%,_rgba(9,13,11,0.98)_100%)] px-2 py-2 backdrop-blur xl:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileNavigation.map((item) => {
          const active = isNavigationActive(item, location.pathname);

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                active
                  ? "bg-brand-primary text-text-inverse"
                  : "text-text-tertiary hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="text-base" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Footer;
