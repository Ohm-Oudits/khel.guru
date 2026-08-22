import { describe, expect, it } from "vitest";
import {
  gameRouteModules,
  redirectRoutes,
  settingsRouteModules,
  sportRouteModules,
  topLevelRouteModules,
  transactionRouteModules,
} from "./routeRegistry";
import { primaryNavigation } from "./platformNavigation";

describe("routeRegistry", () => {
  it("keeps every top-level shell destination mapped to a real route", () => {
    expect(topLevelRouteModules.map((route) => route.path)).toEqual(
      primaryNavigation.map((item) => item.path)
    );
  });

  it("preserves legacy entry points through explicit redirects", () => {
    const redirectMap = Object.fromEntries(
      redirectRoutes.map((route) => [route.path, route.to])
    );

    expect(redirectMap).toEqual({
      "/browse": "/",
      "/game": "/casino",
      "/game/scratch": "/game/balloons",
      "/promotions": "/rewards",
      "/vip-club": "/rewards",
      "/live-support": "/support",
      "/transactions": "/wallet",
    });
  });

  it("keeps the launch sports verticals routable", () => {
    expect(sportRouteModules.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        "/sports/cricket",
        "/sports/football",
        "/sports/tennis",
        "/sports/badminton",
        "/sports/:sportKey",
        "/sports/:sportKey/bet",
        "/sports/:sportKey/leagues/:leagueKey",
        "/sports/:sportKey/leagues/:leagueKey/bet",
      ])
    );
  });

  it("retains the priority originals routes needed for the casino lobby", () => {
    expect(gameRouteModules.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        "/game/crash",
        "/game/dice",
        "/game/blackjack",
        "/game/roulette",
      ])
    );
  });

  it("exposes settings and cashier deep links from the new hubs", () => {
    expect(settingsRouteModules.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        "/settings/security",
        "/settings/sessions",
        "/settings/verify",
      ])
    );
    expect(transactionRouteModules.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        "/transactions/deposits",
        "/transactions/withdrawals",
        "/transactions/bet-archive",
      ])
    );
  });
});
