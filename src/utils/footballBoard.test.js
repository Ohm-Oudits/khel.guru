import { describe, expect, it } from "vitest";
import {
  extraMarketCountOf,
  formatFootballClock,
  formatLeagueHeading,
  groupEventsByLeague,
  isThreeWaySport,
  leaguePriority,
  marketTitleOf,
  usesMatchBoard,
} from "./footballBoard";

describe("footballBoard", () => {
  it("formats league headings like Stake", () => {
    expect(formatLeagueHeading("England - Premier League")).toBe(
      "England / Premier League"
    );
    expect(formatLeagueHeading("Spain / La Liga")).toBe("Spain / La Liga");
  });

  it("formats live clock as minute plus period", () => {
    expect(
      formatFootballClock({ minute: 15, statusDetail: "1st half" })
    ).toBe("15' FirstHalf");
    expect(
      formatFootballClock({ minute: 19, statusDetail: "First half" })
    ).toBe("19' FirstHalf");
    expect(formatFootballClock({ statusDetail: "Half Time" })).toBe("HalfTime");
    expect(formatFootballClock({ statusDetail: "null" })).toBe("");
    expect(formatFootballClock({ minute: null, statusDetail: "Null" })).toBe(
      ""
    );
  });

  it("ranks Premier League above other leagues", () => {
    expect(leaguePriority("England - Premier League")).toBeLessThan(
      leaguePriority("J2 League")
    );
  });

  it("shows extra markets as count minus match result", () => {
    expect(extraMarketCountOf({ metadata: { marketCount: 111 } })).toBe(110);
  });

  it("uses a 3-way match board only for draw sports", () => {
    expect(usesMatchBoard("basketball")).toBe(true);
    expect(usesMatchBoard("cricket")).toBe(false);
    expect(isThreeWaySport("football")).toBe(true);
    expect(isThreeWaySport("icehockey")).toBe(true);
    expect(isThreeWaySport("tennis")).toBe(false);
    expect(marketTitleOf("tennis")).toBe("Match Winner");
    expect(marketTitleOf("handball")).toBe("Match Result");
    expect(isThreeWaySport("basketball")).toBe(false);
    expect(marketTitleOf("mma")).toBe("Match Winner");
    expect(marketTitleOf("esports")).toBe("Match Winner");
  });

  it("groups mixed-sport boards by sport and league", () => {
    const groups = groupEventsByLeague(
      [
        { sportGroup: "tennis", leagueName: "ATP - Rome" },
        { sportGroup: "football", leagueName: "England - Premier League" },
        { sportGroup: "football", leagueName: "England - Premier League" },
      ],
      { includeSport: true }
    );
    expect(groups[0].sport).toBe("football");
    expect(groups[0].events).toHaveLength(2);
    expect(groups[1].sport).toBe("tennis");
  });
});
