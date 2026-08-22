import {
  FaBolt,
  FaCoins,
  FaCrown,
  FaDice,
  FaFootballBall,
  FaGift,
  FaHeadset,
  FaHome,
  FaLifeRing,
  FaQuestionCircle,
  FaSearch,
  FaShieldAlt,
  FaTrophy,
  FaUserCog,
  FaWallet,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import {
  MdSportsBaseball,
  MdSportsBasketball,
  MdSportsCricket,
  MdSportsFootball,
  MdSportsGolf,
  MdSportsHockey,
  MdSportsMma,
  MdSportsTennis,
} from "react-icons/md";
import { GiRugbyConversion } from "react-icons/gi";
import { PiCardsBold } from "react-icons/pi";

export const primaryNavigation = [
  { label: "Home", path: "/", icon: FaHome, matchPrefixes: ["/"] },
  {
    label: "Casino",
    path: "/casino",
    icon: FaDice,
    matchPrefixes: ["/casino", "/game"],
  },
  {
    label: "Sports",
    path: "/sports",
    icon: FaFootballBall,
    matchPrefixes: ["/sports"],
  },
  {
    label: "Wallet",
    path: "/wallet",
    icon: FaWallet,
    matchPrefixes: ["/wallet", "/transactions"],
  },
  {
    label: "Rewards",
    path: "/rewards",
    icon: FaGift,
    matchPrefixes: ["/rewards", "/promotions", "/vip-club"],
  },
  {
    label: "Support",
    path: "/support",
    icon: FaLifeRing,
    matchPrefixes: ["/support", "/live-support"],
  },
  {
    label: "Settings",
    path: "/settings",
    icon: FaUserCog,
    matchPrefixes: ["/settings"],
  },
];

export const mobileNavigation = [
  primaryNavigation[5],
  primaryNavigation[1],
  primaryNavigation[0],
  primaryNavigation[2],
  primaryNavigation[4],
];

export const casinoBrowseLinks = [
  {
    label: "Originals",
    path: "/casino",
    icon: HiSparkles,
    description: "Fast in-house games and exclusive launches",
  },
  {
    label: "Live Casino",
    path: "/game/baccarat",
    icon: PiCardsBold,
    description: "Dealer-style table sessions and classic games",
  },
  {
    label: "Roulette",
    path: "/game/roulette",
    icon: FaCoins,
    description: "High-tempo table action with clear bet zones",
  },
  {
    label: "Blackjack",
    path: "/game/blackjack",
    icon: PiCardsBold,
    description: "Card-first gameplay with instant round entry",
  },
  {
    label: "Crash",
    path: "/game/crash",
    icon: FaBolt,
    description: "Realtime multiplier action with instant checkout tension",
  },
  {
    label: "Dice",
    path: "/game/dice",
    icon: FaDice,
    description: "Simple odds-led wagering for fast repeat play",
  },
];

export const sportsbookBrowseLinks = [
  {
    label: "Cricket",
    path: "/sports/cricket",
    sportKey: "cricket",
    cover: "/sports/cricket.png",
    icon: MdSportsCricket,
    description: "India-first launch sport with live and upcoming markets",
  },
  {
    label: "Football",
    path: "/sports/football",
    sportKey: "football",
    cover: "/sports/football.png",
    icon: FaFootballBall,
    description: "Global headline markets and matchday bets",
  },
  {
    label: "Tennis",
    path: "/sports/tennis",
    sportKey: "tennis",
    cover: "/sports/tennis.png",
    icon: MdSportsTennis,
    description: "Fast event cadence and in-play momentum swings",
  },
  {
    label: "Basketball",
    path: "/sports/basketball",
    sportKey: "basketball",
    cover: "/sports/basketball.png",
    icon: MdSportsBasketball,
    description: "NBA and international boards",
  },
  {
    label: "American Football",
    path: "/sports/americanfootball",
    sportKey: "americanfootball",
    cover: "/sports/americanfootball.png",
    icon: MdSportsFootball,
    description: "NFL and college markets",
  },
  {
    label: "Baseball",
    path: "/sports/baseball",
    sportKey: "baseball",
    cover: "/sports/baseball.png",
    icon: MdSportsBaseball,
    description: "MLB and season boards",
  },
  {
    label: "Ice Hockey",
    path: "/sports/icehockey",
    sportKey: "icehockey",
    cover: "/sports/icehockey.png",
    icon: MdSportsHockey,
    description: "NHL and international ice",
  },
  {
    label: "MMA",
    path: "/sports/mma",
    sportKey: "mma",
    cover: "/sports/mma.png",
    icon: MdSportsMma,
    description: "UFC and combat cards",
  },
  {
    label: "Golf",
    path: "/sports/golf",
    sportKey: "golf",
    cover: "/sports/golf.png",
    icon: MdSportsGolf,
    description: "Majors and tour outrights",
  },
  {
    label: "Rugby",
    path: "/sports/rugby",
    sportKey: "rugby",
    cover: "/sports/rugby.png",
    icon: GiRugbyConversion,
    description: "League and union fixtures",
  },
  {
    label: "Badminton",
    path: "/sports/badminton",
    sportKey: "badminton",
    cover: "/sports/badminton.png",
    icon: HiSparkles,
    description: "Quick markets suited to mobile-first bettors",
  },
  {
    label: "Esports",
    path: "/sports/esports",
    sportKey: "esports",
    cover: "/sports/esports.png",
    icon: FaBolt,
    description: "Live competitive gaming markets",
  },
  {
    label: "Darts",
    path: "/sports/darts",
    sportKey: "darts",
    cover: "/sports/darts.png",
    icon: FaBolt,
    description: "PDC and nightly darts boards",
  },
  {
    label: "Boxing",
    path: "/sports/boxing",
    sportKey: "boxing",
    cover: "/sports/boxing.png",
    icon: MdSportsMma,
    description: "Title fights and undercards",
  },
  {
    label: "Handball",
    path: "/sports/handball",
    sportKey: "handball",
    cover: "/sports/handball.png",
    icon: FaFootballBall,
    description: "European league and cup handball",
  },
  {
    label: "Volleyball",
    path: "/sports/volleyball",
    sportKey: "volleyball",
    cover: "/sports/volleyball.png",
    icon: FaFootballBall,
    description: "Indoor volleyball fixtures",
  },
  {
    label: "Snooker",
    path: "/sports/snooker",
    sportKey: "snooker",
    cover: "/sports/snooker.png",
    icon: FaBolt,
    description: "Ranking events and frames",
  },
  {
    label: "Table Tennis",
    path: "/sports/tabletennis",
    sportKey: "tabletennis",
    cover: "/sports/tabletennis.png",
    icon: MdSportsTennis,
    description: "Fast table-tennis matches",
  },
  {
    label: "Water Polo",
    path: "/sports/waterpolo",
    sportKey: "waterpolo",
    cover: "/sports/waterpolo.png",
    icon: FaFootballBall,
    description: "Pool fixtures and internationals",
  },
  {
    label: "Futsal",
    path: "/sports/futsal",
    sportKey: "futsal",
    cover: "/sports/futsal.png",
    icon: FaFootballBall,
    description: "Indoor football markets",
  },
  {
    label: "Beach Volley",
    path: "/sports/beachvolleyball",
    sportKey: "beachvolleyball",
    cover: "/sports/beachvolleyball.png",
    icon: FaFootballBall,
    description: "Sand-court volleyball",
  },
  {
    label: "Aussie Rules",
    path: "/sports/aussierules",
    sportKey: "aussierules",
    cover: "/sports/aussierules.png",
    icon: GiRugbyConversion,
    description: "AFL-style oval football",
  },
  {
    label: "Floorball",
    path: "/sports/floorball",
    sportKey: "floorball",
    cover: "/sports/floorball.png",
    icon: MdSportsHockey,
    description: "Indoor floorball leagues",
  },
  {
    label: "Squash",
    path: "/sports/squash",
    sportKey: "squash",
    cover: "/sports/squash.png",
    icon: MdSportsTennis,
    description: "PSA and domestic squash",
  },
  {
    label: "Beach Soccer",
    path: "/sports/beachsoccer",
    sportKey: "beachsoccer",
    cover: "/sports/beachsoccer.png",
    icon: FaFootballBall,
    description: "Sand-pitch football",
  },
  {
    label: "Lacrosse",
    path: "/sports/lacrosse",
    sportKey: "lacrosse",
    cover: "/sports/lacrosse.png",
    icon: FaFootballBall,
    description: "Field and box lacrosse",
  },
  {
    label: "Curling",
    path: "/sports/curling",
    sportKey: "curling",
    cover: "/sports/curling.png",
    icon: MdSportsHockey,
    description: "Sheet curling matches",
  },
  {
    label: "Padel",
    path: "/sports/padel",
    sportKey: "padel",
    cover: "/sports/padel.png",
    icon: MdSportsTennis,
    description: "Enclosed-court padel",
  },
  {
    label: "Bandy",
    path: "/sports/bandy",
    sportKey: "bandy",
    cover: "/sports/bandy.png",
    icon: MdSportsHockey,
    description: "Ice bandy fixtures",
  },
  {
    label: "Gaelic Football",
    path: "/sports/gaelicfootball",
    sportKey: "gaelicfootball",
    cover: "/sports/gaelicfootball.png",
    icon: FaFootballBall,
    description: "Gaelic football championships",
  },
  {
    label: "Beach Handball",
    path: "/sports/beachhandball",
    sportKey: "beachhandball",
    cover: "/sports/beachhandball.png",
    icon: FaFootballBall,
    description: "Sand-court handball",
  },
  {
    label: "Athletics",
    path: "/sports/athletics",
    sportKey: "athletics",
    cover: "/sports/athletics.png",
    icon: FaBolt,
    description: "Track and field meetings",
  },
  {
    label: "Cross-Country",
    path: "/sports/crosscountry",
    sportKey: "crosscountry",
    cover: "/sports/crosscountry.png",
    icon: FaBolt,
    description: "Cross-country running",
  },
  {
    label: "Cycling",
    path: "/sports/cycling",
    sportKey: "cycling",
    cover: "/sports/cycling.png",
    icon: FaBolt,
    description: "Road and track cycling",
  },
  {
    label: "In-Play",
    path: "/sports",
    icon: FaBolt,
    description: "Live-first market browsing, pricing, and trend surfacing",
  },
  {
    label: "Boosted Picks",
    path: "/rewards",
    icon: FaTrophy,
    description: "Promotion-led featured markets and events",
  },
];

export const sportsbookSportLinks = sportsbookBrowseLinks.filter(
  (link) => link.sportKey
);

export const rewardPrograms = [
  {
    title: "VIP Club",
    description: "Level progression, hosts, and member-only boosts.",
    icon: FaCrown,
  },
  {
    title: "Rakeback",
    description: "Transparent wagering rewards across casino and sports.",
    icon: FaGift,
  },
  {
    title: "Reloads",
    description: "Timed claim windows that reward regular players.",
    icon: FaBolt,
  },
  {
    title: "Raffles & Races",
    description: "Weekly prize pools and leaderboard moments.",
    icon: FaTrophy,
  },
];

export const supportLinks = [
  {
    title: "Help Center",
    description: "Guides, FAQs, and product education.",
    icon: FaQuestionCircle,
  },
  {
    title: "Fairness",
    description: "Provably fair verification and game trust surfaces.",
    icon: FaShieldAlt,
  },
  {
    title: "Responsible Gaming",
    description: "Limits, cooling-off controls, and safer-play tools.",
    icon: FaLifeRing,
  },
  {
    title: "Live Support",
    description: "Realtime support entry points and escalation routes.",
    icon: FaHeadset,
  },
];

export const walletActionCards = [
  {
    title: "Cashier",
    action: "Open wallet",
    tab: "wallet",
    icon: FaWallet,
  },
  {
    title: "Vault",
    action: "Move funds",
    tab: "vault",
    icon: FaShieldAlt,
  },
  {
    title: "Search",
    action: "Browse faster",
    tab: "search",
    icon: FaSearch,
  },
];

export const settingsSections = [
  {
    title: "General",
    description: "Profile details, identity basics, and account info.",
    path: "/settings/general",
  },
  {
    title: "Security",
    description: "Password, 2FA, and recovery controls.",
    path: "/settings/security",
  },
  {
    title: "Preferences",
    description: "Odds display, UI preferences, and notification choices.",
    path: "/settings/preferences",
  },
  {
    title: "Sessions",
    description: "Device visibility and active session review.",
    path: "/settings/sessions",
  },
  {
    title: "Verification",
    description: "KYC readiness and account verification entry points.",
    path: "/settings/verify",
  },
  {
    title: "API & Extras",
    description: "Developer access, ignored users, and advanced settings.",
    path: "/settings/api",
  },
];

export const heroMetrics = [
  { label: "Casino Priority", value: "17 Originals" },
  { label: "Sports Focus", value: "Cricket First" },
  { label: "Launch Model", value: "Hybrid Demo" },
  { label: "Support Surface", value: "Fairness + Help" },
];

export const stakeComparisonChecklist = [
  "Top-level Home, Casino, Sports, Rewards, Support, and Settings flow",
  "Search-first discovery and clear browse categories",
  "Promotions and VIP surfaced as first-class product areas",
  "Wallet and Vault visible without entering deep account menus",
  "Support, fairness, and responsible-gaming links easy to reach",
];

export const isNavigationActive = (item, pathname) => {
  if (item.path === "/") {
    return pathname === "/";
  }

  return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
};
