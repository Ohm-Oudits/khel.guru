export const DEFAULT_SPORT_GROUPS = [
  { sportKey: "cricket", title: "Cricket" },
  { sportKey: "football", title: "Football" },
  { sportKey: "tennis", title: "Tennis" },
  { sportKey: "basketball", title: "Basketball" },
  { sportKey: "baseball", title: "Baseball" },
  { sportKey: "americanfootball", title: "American Football" },
  { sportKey: "icehockey", title: "Ice Hockey" },
  { sportKey: "esports", title: "Esports" },
  { sportKey: "darts", title: "Darts" },
  { sportKey: "mma", title: "MMA" },
  { sportKey: "boxing", title: "Boxing" },
  { sportKey: "handball", title: "Handball" },
  { sportKey: "volleyball", title: "Volleyball" },
  { sportKey: "snooker", title: "Snooker" },
  { sportKey: "tabletennis", title: "Table Tennis" },
  { sportKey: "rugby", title: "Rugby" },
  { sportKey: "waterpolo", title: "Water Polo" },
  { sportKey: "futsal", title: "Futsal" },
  { sportKey: "beachvolleyball", title: "Beach Volley" },
  { sportKey: "aussierules", title: "Aussie Rules" },
  { sportKey: "floorball", title: "Floorball" },
  { sportKey: "squash", title: "Squash" },
  { sportKey: "beachsoccer", title: "Beach Soccer" },
  { sportKey: "lacrosse", title: "Lacrosse" },
  { sportKey: "curling", title: "Curling" },
  { sportKey: "padel", title: "Padel" },
  { sportKey: "bandy", title: "Bandy" },
  { sportKey: "gaelicfootball", title: "Gaelic Football" },
  { sportKey: "beachhandball", title: "Beach Handball" },
  { sportKey: "athletics", title: "Athletics" },
  { sportKey: "badminton", title: "Badminton" },
  { sportKey: "crosscountry", title: "Cross-Country" },
  { sportKey: "golf", title: "Golf" },
  { sportKey: "cycling", title: "Cycling" },
];

const SPORT_GROUP_CANONICAL = {
  soccer: "football",
  rugbyleague: "rugby",
  rugbyunion: "rugby",
  mixedmartialarts: "mma",
};

const KNOWN_COVERS = new Set(DEFAULT_SPORT_GROUPS.map((sport) => sport.sportKey));

export const canonicalizeSportGroup = (sportKey = "") => {
  const compact = String(sportKey).toLowerCase().trim().replace(/-/g, "");
  return SPORT_GROUP_CANONICAL[compact] || compact;
};

export const sportPrefixOf = (providerSportKey = "") => {
  const key = String(providerSportKey).toLowerCase().trim();
  if (!key) return "";
  const cut = key.indexOf("_");
  return cut === -1 ? key : key.slice(0, cut);
};

export const resolveSportGroup = (providerSportKey = "") =>
  canonicalizeSportGroup(sportPrefixOf(providerSportKey));

export const coverOfSportGroup = (sportKey = "") => {
  const key = canonicalizeSportGroup(sportKey);
  if (KNOWN_COVERS.has(key)) return `/sports/${key}.png`;
  return "/sports/default.png";
};

export const toSportGroupCard = (sport) => ({
  label: sport.title || sport.label,
  path: sport.path || `/sports/${canonicalizeSportGroup(sport.sportKey)}`,
  sportKey: canonicalizeSportGroup(sport.sportKey) || sport.sportKey,
  cover: sport.cover || coverOfSportGroup(sport.sportKey),
  leagues: sport.leagues || [],
  leagueCount: sport.leagueCount || sport.leagues?.length || 0,
  liveCount: sport.liveCount || 0,
});

export const defaultSportsbookGroupCards = DEFAULT_SPORT_GROUPS.map((sport) =>
  toSportGroupCard({
    ...sport,
    cover: coverOfSportGroup(sport.sportKey),
  })
);

export const SPORT_GROUP_ALIASES = {
  football: ["soccer"],
  soccer: ["football"],
  rugby: ["rugbyleague", "rugbyunion"],
};

export const titleOfSportGroup = (sportKey = "") => {
  const key = canonicalizeSportGroup(sportKey);
  const known = DEFAULT_SPORT_GROUPS.find((sport) => sport.sportKey === key);
  if (known) return known.title;
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const resolveSportGroupKeys = (sportKey = "") => {
  const key = canonicalizeSportGroup(sportKey);
  return [key, ...(SPORT_GROUP_ALIASES[key] || [])];
};

export const matchesRequestedSport = (requested, incoming) => {
  if (!requested || !incoming) return true;
  const left = canonicalizeSportGroup(requested);
  const right = canonicalizeSportGroup(incoming);
  if (left === right) return true;
  return (
    resolveSportGroupKeys(left).includes(right) ||
    resolveSportGroupKeys(right).includes(left)
  );
};

export const isCricketSportGroup = (sportKey = "") =>
  canonicalizeSportGroup(sportKey) === "cricket";
