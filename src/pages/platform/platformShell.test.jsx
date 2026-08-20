import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./HomePage";
import CasinoLobby from "./CasinoLobby";
import SportsbookHub from "./SportsbookHub";
import WalletHub from "./WalletHub";
import RewardsHub from "./RewardsHub";
import SupportHub from "./SupportHub";
import SettingsHub from "./SettingsHub";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("platform shell pages", () => {
  it("renders the home surface", () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /premium shell/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /fast entry into khel guru originals/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the casino lobby with search and catalog shelves", () => {
    renderWithProviders(<CasinoLobby />, { route: "/casino" });

    expect(
      screen.getByPlaceholderText(/search originals, tables, or creators/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /trending now/i })
    ).toBeInTheDocument();
  });

  it("renders the sportsbook hub with event search", () => {
    renderWithProviders(<SportsbookHub />, { route: "/sports" });

    expect(
      screen.getByRole("heading", {
        name: /search live and upcoming events/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search teams, leagues, or sports/i)
    ).toBeInTheDocument();
  });

  it("renders the signed-out wallet shell and action prompts", () => {
    renderWithProviders(<WalletHub />, { route: "/wallet" });

    expect(
      screen.getByRole("heading", {
        name: /sign in to use wallet actions/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open login/i })).toBeVisible();
    expect(
      screen.getByRole("button", { name: /open register/i })
    ).toBeVisible();
  });

  it("renders the rewards hub with VIP surfaces", () => {
    renderWithProviders(<RewardsHub />, { route: "/rewards" });

    expect(
      screen.getByRole("heading", {
        name: /promotions and loyalty are now a first-class destination/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("VIP Club")).toBeInTheDocument();
    expect(screen.getByText("Rakeback")).toBeInTheDocument();
  });

  it("renders the support hub with fairness and safer-play topics", () => {
    renderWithProviders(<SupportHub />, { route: "/support" });

    expect(
      screen.getByRole("heading", {
        name: /support, fairness, and safer-play links should always be within reach/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/provably fair verification and game trust surfaces/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Self Exclusion")).toBeInTheDocument();
  });

  it("renders the settings hub with verification access", () => {
    renderWithProviders(<SettingsHub />, { route: "/settings" });

    expect(
      screen.getByRole("heading", {
        name: /security, preferences, sessions, and verification from one top-level account hub/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Verification")).toBeInTheDocument();
    expect(screen.getByText("API & Extras")).toBeInTheDocument();
  });
});
