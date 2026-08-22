const THREE_WAY_SPORTS = new Set([
  "football",
  "futsal",
  "beachsoccer",
  "handball",
  "icehockey",
  "rugby",
  "gaelicfootball",
  "floorball",
  "waterpolo",
  "bandy",
  "beachhandball",
]);

export const usesMatchBoard = (sportGroup = "") =>
  String(sportGroup).toLowerCase() !== "cricket";

export const isThreeWaySport = (sportGroup = "") =>
  THREE_WAY_SPORTS.has(String(sportGroup).toLowerCase());

export const marketTitleOf = (sportGroup = "", hasDraw = false) =>
  isThreeWaySport(sportGroup) || hasDraw ? "Match Result" : "Match Winner";

export const formatLeagueHeading = (league = "") =>
  String(league)
    .replace(/\s+[–—-]\s+/g, " / ")
    .replace(/\s+\/\s+/g, " / ")
    .trim();

const isBlankClockValue = (value) => {
  if (value == null) return true;
  const text = String(value).trim();
  return !text || /^(null|undefined|none|n\/a|-)$/i.test(text);
};

export const formatFootballPeriod = (detail = "") => {
  if (isBlankClockValue(detail)) return "";
  const text = String(detail).trim();
  const lower = text.toLowerCase();
  if (/\b(1st|first)\b/.test(lower) && /half/.test(lower)) return "FirstHalf";
  if (/\b(2nd|second)\b/.test(lower) && /half/.test(lower)) return "SecondHalf";
  if (/half[\s-]?time|\bht\b/.test(lower)) return "HalfTime";
  if (/extra[\s-]?time|\bet\b/.test(lower)) return "ExtraTime";
  if (/penalt/.test(lower)) return "Penalties";
  return text
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
};

export const formatFootballClock = (clock = {}, fallback = "") => {
  const minute = isBlankClockValue(clock.minute ?? clock.minutes)
    ? ""
    : clock.minute ?? clock.minutes;
  const period = formatFootballPeriod(
    clock.statusDetail || clock.period || fallback
  );
  const hasMinute = minute !== "";
  if (!hasMinute && !period) return "";
  return [hasMinute ? `${minute}'` : "", period].filter(Boolean).join(" ");
};

export const groupEventsByLeague = (rows = [], { includeSport = false } = {}) => {
  const buckets = new Map();
  for (const event of rows) {
    const league =
      event.leagueName || event.sportName || event.sportKey || "Markets";
    const sport = event.sportGroup || event.sportName || "";
    const key = includeSport ? `${sport}::${league}` : league;
    const list = buckets.get(key) || [];
    list.push(event);
    buckets.set(key, list);
  }
  return Array.from(buckets.entries())
    .map(([key, events]) => {
      const league =
        events[0]?.leagueName ||
        events[0]?.sportName ||
        events[0]?.sportKey ||
        "Markets";
      const sport = events[0]?.sportGroup || "";
      return { key, league, sport, events };
    })
    .sort((left, right) => {
      const rank = leaguePriority(left.league) - leaguePriority(right.league);
      if (rank !== 0) return rank;
      const sportRank = String(left.sport).localeCompare(String(right.sport));
      return sportRank !== 0 ? sportRank : left.league.localeCompare(right.league);
    });
};

export const leaguePriority = (league = "") => {
  const name = String(league).toLowerCase();
  if (name.includes("premier league")) return 0;
  if (name.includes("la liga") || name.includes("laliga")) return 1;
  if (name.includes("serie a")) return 2;
  if (name.includes("bundesliga")) return 3;
  if (name.includes("ligue 1")) return 4;
  if (name.includes("champions league")) return 5;
  if (name.includes("europa league")) return 6;
  if (name.includes("nba") || name.includes("ncaa")) return 7;
  if (name.includes("nfl")) return 8;
  if (/\batp\b|\bwta\b/.test(name)) return 9;
  return 50;
};

export const selectionForTeam = (market, team) => {
  if (!market || !team) return null;
  const name = String(team.name || "").toLowerCase();
  const shortName = String(team.shortName || "").toLowerCase();
  return (market.selections || []).find((selection) => {
    const selectionName = String(selection.name || "").toLowerCase();
    const key = String(selection.key || "").toLowerCase();
    return (
      selectionName === name ||
      selectionName === shortName ||
      key === name.replace(/\s+/g, "_") ||
      (shortName && (key === shortName || key.includes(shortName)))
    );
  });
};

export const drawSelectionOf = (market) =>
  (market?.selections || []).find((selection) => {
    const name = String(selection.name || "").toLowerCase();
    const key = String(selection.key || "").toLowerCase();
    return name === "draw" || name === "tie" || key === "draw" || key === "x";
  });

export const extraMarketCountOf = (event = {}, market) => {
  const stored = Number(event.metadata?.marketCount);
  if (Number.isFinite(stored) && stored > 1) return stored - 1;
  const extras = Number(event.metadata?.extraMarkets);
  if (Number.isFinite(extras) && extras > 0) return extras;
  const bookmakers = Number(market?.bookmakerCount);
  return Number.isFinite(bookmakers) && bookmakers > 1 ? bookmakers : 0;
};
