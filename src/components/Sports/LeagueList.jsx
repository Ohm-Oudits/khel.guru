import { useEffect, useMemo, useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { apiService } from "../../config/api";
import {
  coverOfSportGroup,
  resolveSportGroupKeys,
  titleOfSportGroup,
} from "../../config/sportsbookGroups";
import { useSportsbookGroups } from "../../hooks/useSportsbookGroups";

const LeagueRow = ({ sportKey, league, count, liveCount }) => (
  <Link
    to={`/sports/${sportKey}/leagues/${league.key}`}
    className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0 transition hover:bg-background-surface"
  >
    <div
      className="h-12 w-10 shrink-0 rounded-lg bg-cover bg-center"
      style={{ backgroundImage: `url(${league.cover})` }}
    />
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold text-white">{league.title}</p>
      <p className="truncate text-xs text-text-tertiary">{league.key}</p>
    </div>
    <p className="shrink-0 text-xs text-text-tertiary">
      {liveCount
        ? `${liveCount} live`
        : count
          ? `${count} games`
          : "No games yet"}
    </p>
    <FaChevronRight className="shrink-0 text-xs text-text-muted" />
  </Link>
);

const LeagueSection = ({
  title,
  live,
  leagues,
  emptyLabel,
  sportKey,
  counts,
}) => (
  <section>
    <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
      {live ? (
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      ) : null}
      {title}
    </h2>
    {leagues.length ? (
      <div className="overflow-hidden rounded-xl border border-white/5 bg-background-tertiary">
        {leagues.map((league) => (
          <LeagueRow
            key={league.key}
            sportKey={sportKey}
            league={league}
            count={counts.total[league.key] || 0}
            liveCount={counts.live[league.key] || 0}
          />
        ))}
      </div>
    ) : (
      <div className="rounded-xl border border-white/5 bg-background-tertiary px-4 py-8 text-center text-sm text-text-tertiary">
        {emptyLabel}
      </div>
    )}
  </section>
);

const LeagueList = ({ sportKey }) => {
  const groups = useSportsbookGroups();
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState({ live: {}, upcoming: {}, total: {} });

  const parentKeys = useMemo(
    () => resolveSportGroupKeys(sportKey),
    [sportKey]
  );

  const leagues = useMemo(() => {
    const rows = groups
      .filter((group) => parentKeys.includes(group.sportKey))
      .flatMap((group) =>
        (group.leagues || []).map((league) => ({
          key: league.key,
          title: league.title || titleOfSportGroup(league.key),
          cover: group.cover || coverOfSportGroup(group.sportKey),
        }))
      );

    const unique = new Map();
    for (const row of rows) {
      if (!unique.has(row.key)) unique.set(row.key, row);
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [groups, parentKeys]);

  useEffect(() => {
    let cancelled = false;

    apiService.sports
      .getEvents({ sportKey, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const next = { live: {}, upcoming: {}, total: {} };
        for (const event of res.data?.events || []) {
          const key = event.sportKey || event.sportGroup;
          if (!key) continue;
          next.total[key] = (next.total[key] || 0) + 1;
          if (event.status === "live") {
            next.live[key] = (next.live[key] || 0) + 1;
          } else if (event.status === "upcoming") {
            next.upcoming[key] = (next.upcoming[key] || 0) + 1;
          }
        }
        setCounts(next);
      })
      .catch(() => {
        setCounts({ live: {}, upcoming: {}, total: {} });
      });

    return () => {
      cancelled = true;
    };
  }, [sportKey]);

  const visible = leagues.filter((league) => {
    if (!query.trim()) return true;
    const haystack = `${league.title} ${league.key}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const liveLeagues = visible.filter((league) => counts.live[league.key]);
  const upcomingLeagues = visible.filter((league) => !counts.live[league.key]);

  if (!leagues.length) {
    return (
      <div className="space-y-6">
        <LeagueSection
          title="Live"
          live
          leagues={[]}
          emptyLabel={`No live ${titleOfSportGroup(sportKey)} leagues right now.`}
          sportKey={sportKey}
          counts={counts}
        />
        <LeagueSection
          title="Upcoming"
          leagues={[]}
          emptyLabel={`No upcoming ${titleOfSportGroup(sportKey)} leagues yet.`}
          sportKey={sportKey}
          counts={counts}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
            Leagues
          </p>
          <p className="mt-1 text-sm text-text-tertiary">
            {leagues.length} boards · live now and upcoming
          </p>
        </div>
        {leagues.length > 8 && (
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter leagues"
            className="w-48 rounded-lg border border-white/10 bg-background-tertiary px-3 py-2 text-sm text-white outline-none placeholder:text-text-muted focus:border-brand-primary/50"
          />
        )}
      </div>

      <LeagueSection
        title="Live"
        live
        leagues={liveLeagues}
        emptyLabel="No live leagues right now."
        sportKey={sportKey}
        counts={counts}
      />
      <LeagueSection
        title="Upcoming"
        leagues={upcomingLeagues}
        emptyLabel="No upcoming leagues right now."
        sportKey={sportKey}
        counts={counts}
      />

      {query && !visible.length && (
        <p className="text-center text-sm text-text-tertiary">
          No leagues match “{query}”.
        </p>
      )}
    </div>
  );
};

export default LeagueList;
