// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppPreferencesProvider } from "../../../context";
import Navbar from "../Navbar/Navbar";
import PublicNavbar from "./PublicNavbar";

const clerkState = vi.hoisted(() => ({ signedIn: false }));

vi.mock("@clerk/clerk-react", () => ({
  SignedIn: ({ children }: { children: ReactNode }) =>
    clerkState.signedIn ? children : null,
  SignedOut: ({ children }: { children: ReactNode }) =>
    clerkState.signedIn ? null : children,
  UserButton: () => <button aria-label="User account">User</button>,
  SignOutButton: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    activeProps,
    ...props
  }: {
    to: string;
    children: ReactNode;
    activeProps?: unknown;
    [key: string]: unknown;
  }) => {
    void activeProps;
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  },
}));

function renderNavbar(language: "de" | "en") {
  localStorage.setItem("language", language);
  return render(
    <AppPreferencesProvider>
      <PublicNavbar />
    </AppPreferencesProvider>,
  );
}

describe("PublicNavbar authentication controls", () => {
  beforeEach(() => {
    localStorage.clear();
    clerkState.signedIn = false;
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("shows localized sign-in controls and no user or sign-out when signed out", async () => {
    renderNavbar("en");
    const desktop = screen.getByTestId("desktop-auth-controls");
    expect(
      within(desktop).getByRole("link", { name: "Sign In" }),
    ).toHaveAttribute("href", "/sign-in");
    expect(
      within(desktop).queryByRole("button", { name: "User account" }),
    ).not.toBeInTheDocument();
    expect(
      within(desktop).queryByRole("button", { name: "Sign Out" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      within(screen.getByTestId("mobile-auth-controls")).getByRole("link", {
        name: "Sign In",
      }),
    ).toHaveAttribute("href", "/sign-in");
  });

  it("shows user and localized sign-out controls but no sign-in when signed in", async () => {
    clerkState.signedIn = true;
    renderNavbar("de");
    const desktop = screen.getByTestId("desktop-auth-controls");
    expect(
      within(desktop).queryByRole("link", { name: "Anmelden" }),
    ).not.toBeInTheDocument();
    expect(
      within(desktop).getByRole("button", { name: "User account" }),
    ).toBeVisible();
    expect(
      within(desktop).getByRole("button", { name: "Abmelden" }),
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Menü öffnen" }));
    const mobile = screen.getByTestId("mobile-auth-controls");
    expect(
      within(mobile).getByRole("button", { name: "User account" }),
    ).toBeInTheDocument();
    expect(
      within(mobile).getByRole("button", { name: "Abmelden" }),
    ).toBeInTheDocument();
  });

  it("toggles language directly without a dropdown", async () => {
    renderNavbar("de");
    const switches = screen.getAllByRole("button", {
      name: "Switch to English",
    });
    expect(switches).toHaveLength(2);
    await userEvent.click(switches[0]);
    expect(
      screen.getAllByRole("button", { name: "Auf Deutsch wechseln" }),
    ).toHaveLength(2);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps an explicit localized sign-out control in the authenticated admin topbar", () => {
    clerkState.signedIn = true;
    localStorage.setItem("language", "en");
    render(
      <AppPreferencesProvider>
        <Navbar />
      </AppPreferencesProvider>,
    );

    expect(
      screen.getAllByRole("button", { name: "User account" }),
    ).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Sign Out" })).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "Sign In" }),
    ).not.toBeInTheDocument();
  });
});
