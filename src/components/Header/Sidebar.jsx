import { Link, useLocation } from "react-router-dom";
import {
  casinoBrowseLinks,
  isNavigationActive,
  primaryNavigation,
  sportsbookBrowseLinks,
  supportLinks,
} from "../../config/platformNavigation";

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-[84px] z-30 hidden h-[calc(100vh-84px)] w-[288px] border-r border-white/5 bg-[linear-gradient(180deg,_rgba(9,13,11,1)_0%,_rgba(13,18,16,0.98)_100%)] shadow-[24px_0_80px_rgba(0,0,0,0.26)] xl:block">
      <div className="flex h-full flex-col overflow-y-auto px-4 pb-8 pt-8">
          <div className="space-y-2">
            {primaryNavigation.map((item) => {
              const active = isNavigationActive(item, location.pathname);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-primary text-text-inverse"
                      : "bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-background-secondary p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Casino browse
            </p>
            <div className="mt-4 space-y-2">
              {casinoBrowseLinks.slice(0, 4).map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-text-secondary transition hover:bg-white/5 hover:text-white"
                >
                  <item.icon className="text-brand-primary" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-white/10 bg-background-secondary p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Sports browse
            </p>
            <div className="mt-4 space-y-2">
              {sportsbookBrowseLinks.slice(0, 4).map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-text-secondary transition hover:bg-white/5 hover:text-white"
                >
                  <item.icon className="text-brand-primary" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-white/10 bg-background-secondary p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Support & trust
            </p>
            <div className="mt-4 space-y-2">
              {supportLinks.map((item) => (
                <Link
                  key={item.title}
                  to="/support"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-text-secondary transition hover:bg-white/5 hover:text-white"
                >
                  <item.icon className="text-brand-primary" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
      </div>
    </aside>
  );
};

export default Sidebar;
