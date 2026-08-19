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
import { MdSportsCricket, MdSportsTennis } from "react-icons/md";
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
    icon: MdSportsCricket,
    description: "India-first launch sport with live and upcoming markets",
  },
  {
    label: "Football",
    path: "/sports/football",
    icon: FaFootballBall,
    description: "Global headline markets and matchday bets",
  },
  {
    label: "Tennis",
    path: "/sports/tennis",
    icon: MdSportsTennis,
    description: "Fast event cadence and in-play momentum swings",
  },
  {
    label: "Badminton",
    path: "/sports/badminton",
    icon: HiSparkles,
    description: "Quick markets suited to mobile-first bettors",
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
