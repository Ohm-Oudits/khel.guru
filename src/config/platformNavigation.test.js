import { describe, expect, it } from "vitest";
import {
  casinoBrowseLinks,
  isNavigationActive,
  mobileNavigation,
  primaryNavigation,
  rewardPrograms,
  sportsbookBrowseLinks,
  supportLinks,
} from "./platformNavigation";
import { stakeShellBenchmark } from "./stakeShellBenchmark";

const pluck = (items, key) => items.map((item) => item[key]);

describe("platformNavigation", () => {
  it("matches the target top-level Khel Guru shell order", () => {
    expect(pluck(primaryNavigation, "label")).toEqual(
      stakeShellBenchmark.khelGuruTarget.primaryNavigation
    );
  });

  it("keeps the mobile nav focused on the highest-frequency sections", () => {
    expect(pluck(mobileNavigation, "label")).toEqual(
      stakeShellBenchmark.khelGuruTarget.mobileNavigation
    );
  });

  it("surfaces casino browse entry points that mirror the Stake-style lobby model", () => {
    expect(pluck(casinoBrowseLinks.slice(0, 4), "label")).toEqual(
      stakeShellBenchmark.khelGuruTarget.casinoBrowse
    );
  });

  it("prioritizes sports launch categories around India-first discovery", () => {
    expect(
      sportsbookBrowseLinks
        .filter((item) =>
          stakeShellBenchmark.khelGuruTarget.sportsbookBrowse.includes(
            item.label
          )
        )
        .map((item) => item.label)
    ).toEqual(stakeShellBenchmark.khelGuruTarget.sportsbookBrowse);
  });

  it("exposes support and trust surfaces alongside gameplay and rewards", () => {
    expect(pluck(supportLinks, "title")).toEqual(
      stakeShellBenchmark.khelGuruTarget.supportSurfaces
    );
  });

  it("keeps rewards anchored on the core loyalty building blocks", () => {
    expect(pluck(rewardPrograms, "title")).toEqual(
      stakeShellBenchmark.khelGuruTarget.rewardsSurfaces
    );
  });

  it("marks root and nested sections active in the expected places", () => {
    expect(isNavigationActive(primaryNavigation[0], "/")).toBe(true);
    expect(isNavigationActive(primaryNavigation[1], "/game/crash")).toBe(true);
    expect(isNavigationActive(primaryNavigation[4], "/promotions")).toBe(true);
    expect(isNavigationActive(primaryNavigation[6], "/settings/security")).toBe(
      true
    );
    expect(isNavigationActive(primaryNavigation[2], "/wallet")).toBe(false);
  });
});
