export const topLevelRouteModules = [
  {
    path: "/",
    loader: () => import("../pages/platform/HomePage"),
  },
  {
    path: "/casino",
    loader: () => import("../pages/platform/CasinoLobby"),
  },
  {
    path: "/sports",
    loader: () => import("../pages/platform/SportsbookHub"),
  },
  {
    path: "/wallet",
    loader: () => import("../pages/platform/WalletHub"),
  },
  {
    path: "/rewards",
    loader: () => import("../pages/platform/RewardsHub"),
  },
  {
    path: "/support",
    loader: () => import("../pages/platform/SupportHub"),
  },
  {
    path: "/settings",
    loader: () => import("../pages/platform/SettingsHub"),
  },
];

export const redirectRoutes = [
  { path: "/browse", to: "/" },
  { path: "/game", to: "/casino" },
  { path: "/promotions", to: "/rewards" },
  { path: "/vip-club", to: "/rewards" },
  { path: "/live-support", to: "/support" },
  { path: "/transactions", to: "/wallet" },
  { path: "/game/scratch", to: "/game/balloons" },
];

export const gameRouteModules = [
  {
    path: "/game/wheel",
    loader: () => import("../components/Games/WheelGame/WheelPage"),
  },
  {
    path: "/game/mines",
    loader: () => import("../components/Games/MinesGame/Diamond"),
  },
  {
    path: "/game/parachute",
    loader: () => import("../components/Games/Parachute/Balloon"),
  },
  {
    path: "/game/crash",
    loader: () => import("../components/Games/CrashGame/Crash"),
  },
  {
    path: "/game/plinko",
    loader: () => import("../components/Games/PlinkoGame/Plinko"),
  },
  {
    path: "/game/limbo",
    loader: () => import("../components/Games/LimboGame/Limbo"),
  },
  {
    path: "/game/dice",
    loader: () => import("../components/Games/DiceGame/Dice"),
  },
  {
    path: "/game/keno",
    loader: () => import("../components/Games/Keno/Keno"),
  },
  {
    path: "/game/hilo",
    loader: () => import("../components/Games/Hilo/Hilo"),
  },
  {
    path: "/game/baccarat",
    loader: () => import("../components/Games/Baccarat/Baccarat"),
  },
  {
    path: "/game/blackjack",
    loader: () => import("../components/Games/Blackjack/Blackjack"),
  },
  {
    path: "/game/balloons",
    loader: () => import("../components/Games/BallonScratch/BallonScratch"),
  },
  {
    path: "/game/tower",
    loader: () => import("../components/Games/tower/tower"),
  },
  {
    path: "/game/twist",
    loader: () => import("../components/Games/twist/Twist"),
  },
  {
    path: "/game/roulette",
    loader: () => import("../components/Games/roulette/roulette"),
  },
  {
    path: "/game/pump",
    loader: () => import("../components/Games/pump/pump"),
  },
  {
    path: "/game/slide",
    loader: () => import("../components/Games/Slide/Slide"),
  },
];

export const sportRouteModules = [
  {
    path: "/sports/cricket",
    loader: () => import("../pages/SportsCricket"),
  },
  {
    path: "/sports/cricket/bet",
    loader: () => import("../pages/SportBet"),
  },
  {
    path: "/sports/football",
    loader: () => import("../pages/SportsFootball"),
  },
  {
    path: "/sports/football/bet",
    loader: () => import("../pages/SportBetFootball"),
  },
  {
    path: "/sports/tennis",
    loader: () => import("../pages/SportsTennis"),
  },
  {
    path: "/sports/tennis/bet",
    loader: () => import("../pages/SportBetTennis"),
  },
  {
    path: "/sports/badminton",
    loader: () => import("../pages/SportsBadminton"),
  },
  {
    path: "/sports/badminton/bet",
    loader: () => import("../pages/SportBetBadminton"),
  },
];

export const transactionRouteModules = [
  {
    path: "/transactions/deposits",
    loader: () => import("../pages/transactions/Deposits"),
  },
  {
    path: "/transactions/withdrawals",
    loader: () => import("../pages/transactions/Withdrawal"),
  },
  {
    path: "/transactions/bet-archive",
    loader: () => import("../pages/transactions/BetArcheive"),
  },
  {
    path: "/transactions/other",
    loader: () => import("../pages/transactions/Others"),
  },
];

export const accountRouteModules = [
  {
    path: "/casino/my-bets",
    loader: () => import("../pages/MyBets"),
  },
];

export const settingsRouteModules = [
  {
    path: "/settings/general",
    loader: () => import("../pages/settings/General"),
  },
  {
    path: "/settings/security",
    loader: () => import("../pages/settings/Security"),
  },
  {
    path: "/settings/preferences",
    loader: () => import("../pages/settings/Prefernces"),
  },
  {
    path: "/settings/api",
    loader: () => import("../pages/settings/Api"),
  },
  {
    path: "/settings/sessions",
    loader: () => import("../pages/settings/Sessions"),
  },
  {
    path: "/settings/ignored-users",
    loader: () => import("../pages/settings/IgnoredUsers"),
  },
  {
    path: "/settings/verify",
    loader: () => import("../pages/settings/Verify"),
  },
  {
    path: "/settings/others",
    loader: () => import("../pages/settings/Others"),
  },
];
