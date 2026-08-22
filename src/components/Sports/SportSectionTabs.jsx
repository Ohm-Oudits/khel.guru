const TABS = [
  { key: "live", label: "Live" },
  { key: "stumps", label: "Stumps", cricketOnly: true },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

const SportSectionTabs = ({
  section,
  onChange,
  counts = {},
  showStumps = false,
}) => (
  <div
    role="tablist"
    aria-label="Match sections"
    className="scrollbar-hide flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x]"
  >
    {TABS.filter((tab) => !tab.cricketOnly || showStumps).map((tab) => {
      const count = counts[tab.key];
      return (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={section === tab.key}
          onClick={() => onChange(tab.key)}
          className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm ${
            section === tab.key
              ? "bg-brand-primary text-text-inverse"
              : "bg-background-tertiary text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {tab.label}
          {Number.isFinite(count) ? ` (${count})` : ""}
        </button>
      );
    })}
  </div>
);

export default SportSectionTabs;
