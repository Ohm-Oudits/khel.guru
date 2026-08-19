import { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaClock,
  FaCompass,
  FaDice,
  FaFootballBall,
  FaSearch,
  FaStar,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";
import { originals } from "../../constants";
import {
  primaryNavigation,
  sportsbookBrowseLinks,
  supportLinks,
} from "../../config/platformNavigation";

const SEARCH_STORAGE_KEY = "kg.spotlight.searches";

const FILTERS = [
  { key: "all", label: "All", icon: HiSparkles },
  { key: "casino", label: "Casino", icon: FaDice },
  { key: "sports", label: "Sports", icon: FaFootballBall },
  { key: "pages", label: "Pages", icon: FaCompass },
];

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const storedSearches =
      JSON.parse(localStorage.getItem(SEARCH_STORAGE_KEY)) ||
      JSON.parse(localStorage.getItem("searches")) ||
      [];
    setRecentSearches(storedSearches);
  }, []);

  const casinoItems = originals.map((game) => ({
    id: `casino-${game.id}-${game.name}`,
    title: game.name,
    subtitle: game.creator,
    description: game.exclusive
      ? "Exclusive original ready for instant play."
      : game.new
      ? "New original now live in the casino lobby."
      : "Casino original available from the main lobby.",
    path: game.link,
    scope: "casino",
    section: "Casino",
    badge: game.exclusive ? "Exclusive" : game.new ? "New" : "Original",
    icon: game.exclusive ? HiSparkles : FaDice,
  }));

  const sportsItems = sportsbookBrowseLinks.map((item) => ({
    id: `sports-${item.label}`,
    title: item.label,
    subtitle: "Sportsbook",
    description: item.description,
    path: item.path,
    scope: "sports",
    section: "Sports",
    badge: "Sport",
    icon: item.icon,
  }));

  const pageItems = primaryNavigation.map((item) => ({
    id: `page-${item.label}`,
    title: item.label,
    subtitle: "Navigation",
    description: `Open the ${item.label.toLowerCase()} hub.`,
    path: item.path,
    scope: "pages",
    section: "Pages",
    badge: "Page",
    icon: item.icon,
  }));

  const helpItems = supportLinks.map((item) => ({
    id: `support-${item.title}`,
    title: item.title,
    subtitle: "Support",
    description: item.description,
    path: "/support",
    scope: "pages",
    section: "Support",
    badge: "Help",
    icon: item.icon,
  }));

  const allItems = [...casinoItems, ...sportsItems, ...pageItems, ...helpItems];

  const featuredItems = [
    casinoItems[0],
    casinoItems[3],
    sportsItems[0],
    sportsItems[1],
    pageItems[4],
    helpItems[1],
  ].filter(Boolean);

  const normalizedQuery = search.trim().toLowerCase();

  const filteredItems = allItems.filter((item) => {
    if (selectedFilter !== "all" && item.scope !== selectedFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [
      item.title,
      item.subtitle,
      item.description,
      item.section,
      item.badge,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  const activeResults = normalizedQuery
    ? filteredItems.slice(0, 8)
    : selectedFilter === "all"
    ? featuredItems
    : filteredItems.slice(0, 8);

  const handleClose = () => {
    navigate(location.pathname, { replace: true });
  };

  const persistRecentSearch = (value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return;
    }

    const updatedSearches = [
      trimmedValue,
      ...recentSearches.filter((item) => item !== trimmedValue),
    ].slice(0, 8);

    setRecentSearches(updatedSearches);
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(updatedSearches));
  };

  const handleResultClick = (item) => {
    persistRecentSearch(search || item.title);
    navigate(item.path);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      handleClose();
      return;
    }

    if (event.key === "Enter" && activeResults.length > 0) {
      event.preventDefault();
      handleResultClick(activeResults[0]);
    }
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem(SEARCH_STORAGE_KEY);
    localStorage.removeItem("searches");
  };

  const handleDeleteRecent = (value) => {
    const updatedSearches = recentSearches.filter((item) => item !== value);
    setRecentSearches(updatedSearches);
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(updatedSearches));
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-[rgba(3,6,5,0.76)] px-3 py-4 backdrop-blur-xl md:px-6 md:py-10"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(54,94,76,0.34)_0%,_rgba(17,20,19,0.98)_42%,_rgba(10,12,11,1)_100%)] shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 pb-5 pt-4 md:px-6 md:pb-6 md:pt-5">
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/15 text-lg text-brand-primary">
                <FaSearch />
              </div>

              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                  className="w-full appearance-none border-0 bg-transparent text-lg font-semibold text-white outline-none ring-0 placeholder:text-text-tertiary focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none md:text-2xl"
                  placeholder="Games, sports, support, rewards, pages"
                />
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  Esc
                </span>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  Enter
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = selectedFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setSelectedFilter(filter.key)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-primary text-text-inverse"
                      : "border border-white/10 bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <filter.icon className={active ? "" : "text-brand-primary"} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-h-0">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                    {normalizedQuery ? "Search Results" : "Quick Picks"}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {normalizedQuery
                      ? `Matches for "${search.trim()}"`
                      : "Jump straight into the right surface"}
                  </h2>
                </div>
                <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-text-tertiary md:flex">
                  <FaStar className="text-brand-primary" />
                  {activeResults.length} visible
                </div>
              </div>

              <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1 md:max-h-[52vh]">
                {normalizedQuery && activeResults.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-white/12 bg-black/20 px-5 py-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-brand-primary">
                      <FaSearch />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-white">
                      No matches yet
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary">
                      Try a game title, a sport like cricket, or a surface like
                      support or wallet.
                    </p>
                  </div>
                ) : (
                  activeResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleResultClick(item)}
                      className="group flex w-full items-center gap-4 rounded-[28px] border border-white/10 bg-black/20 px-4 py-4 text-left transition hover:border-brand-primary/40 hover:bg-white/[0.06]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-brand-primary">
                        <item.icon />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {item.title}
                          </h3>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                            {item.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-text-secondary">
                          {item.subtitle}
                        </p>
                        <p className="mt-1 text-sm text-text-tertiary">
                          {item.description}
                        </p>
                      </div>

                      <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-text-tertiary transition group-hover:border-brand-primary/30 group-hover:text-white md:flex">
                        Open
                        <FaArrowRight className="text-brand-primary" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                  <FaClock />
                  Recent Searches
                </div>

                {recentSearches.length === 0 ? (
                  <p className="mt-4 text-sm text-text-secondary">
                    Your recent lookups will appear here once you open a result.
                  </p>
                ) : (
                  <>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {recentSearches.map((value) => (
                        <div
                          key={value}
                          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 pr-2"
                        >
                          <button
                            type="button"
                            onClick={() => setSearch(value)}
                            className="rounded-full px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
                          >
                            {value}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecent(value)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary transition hover:bg-white/10 hover:text-white"
                          >
                            <IoMdClose />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="mt-4 text-sm font-semibold text-red-300 transition hover:text-red-200"
                    >
                      Clear recent searches
                    </button>
                  </>
                )}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                  <HiSparkles />
                  Spotlight Tips
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-sm font-semibold text-white">
                      Search full product surfaces
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Try “support”, “wallet”, “cricket”, “mines”, or “vip”.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-sm font-semibold text-white">
                      Use filters to narrow fast
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Jump between casino titles, sportsbook entry points, and
                      core pages without leaving the overlay.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
