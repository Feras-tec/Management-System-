// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Sidebar from "./Sidebar";
import { AppPreferencesProvider, useAppPreferences } from "../../../context";
import type { BackendIdentity } from "../../../api/backendClient";

const identity = vi.hoisted(() => ({
  sessionId: "session-a",
  signedIn: true,
  getCurrentIdentity: vi.fn(),
}));
const TestSession = createContext({ sessionId: "", signedIn: false });

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => useContext(TestSession),
}));

vi.mock("../../../api/backendClient", () => ({
  createBackendClient: () => ({ getCurrentIdentity: identity.getCurrentIdentity }),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouteContext: () => {
    const { signedIn } = useContext(TestSession);
    return { auth: { isSignedIn: signedIn, getAccessToken: async () => "test-token" } };
  },
  Link: ({
    children,
    onClick,
    to,
  }: {
    children: ReactNode;
    onClick?: () => void;
    to: string;
  }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  ),
}));

function LanguageHarness() {
  const { setLanguage } = useAppPreferences();

  return (
    <>
      <button onClick={() => setLanguage("en")}>Switch language</button>
      <Sidebar />
    </>
  );
}

function renderSidebar() {
  const queryClient = new QueryClient();
  const ui = () => (
    <QueryClientProvider client={queryClient}>
      <TestSession.Provider value={{ sessionId: identity.sessionId, signedIn: identity.signedIn }}>
        <AppPreferencesProvider>
          <LanguageHarness />
        </AppPreferencesProvider>
      </TestSession.Provider>
    </QueryClientProvider>
  );
  const result = render(ui());
  return { queryClient, rerender: () => result.rerender(ui()) };
}

const germanLabels = [
  "Dashboard",
  "Buchungen",
  "Mitarbeiter",
  "Produkte",
  "Kunden",
  "Bewertungen",
  "Kontaktanfragen",
  "Verkäufe",
  "Berichte",
  "Einstellungen",
];

const englishLabels = [
  "Dashboard",
  "Bookings",
  "Employees",
  "Products",
  "Customers",
  "Reviews",
  "Contact messages",
  "Sales",
  "Reports",
  "Settings",
];

describe("Sidebar navigation", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    localStorage.setItem("language", "de");
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3001");
    identity.sessionId = "session-a";
    identity.signedIn = true;
    identity.getCurrentIdentity.mockReset().mockResolvedValue({ user: { role: "ADMIN", isActive: true } });
  });

  it("renders all German labels and the website link for an active ADMIN", async () => {
    renderSidebar();
    expect(await screen.findByRole("link", { name: "Bewertungen" })).toHaveAttribute("href", "/admin/reviews");

    for (const label of germanLabels) {
      expect(screen.getByText(label, { exact: true })).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "Zur Website" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("updates all labels immediately when language changes", async () => {
    renderSidebar();
    await screen.findByRole("link", { name: "Bewertungen" });

    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));

    for (const label of englishLabels) {
      expect(screen.getByText(label, { exact: true })).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "Go to Website" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it.each([
    ["MANAGER", true],
    ["EMPLOYEE", true],
    ["ADMIN", false],
  ] satisfies [BackendIdentity["user"]["role"], boolean][])(
    "does not expose Reviews for %s (active: %s)",
    async (role, isActive) => {
      identity.getCurrentIdentity.mockResolvedValue({ user: { role, isActive } });
      const { queryClient } = renderSidebar();
      await vi.waitFor(() => expect(
        queryClient.getQueryState(["admin-navigation-identity", "session-a"])?.status,
      ).toBe("success"));
      expect(screen.queryByRole("link", { name: "Bewertungen" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Kontaktanfragen" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
    },
  );

  it("does not carry a cached ADMIN link into a different or signed-out session", async () => {
    const { queryClient, rerender } = renderSidebar();
    await screen.findByRole("link", { name: "Bewertungen" });
    identity.sessionId = "session-b";
    identity.getCurrentIdentity.mockRejectedValue(new Error("403"));
    rerender();
    expect(screen.queryByRole("link", { name: "Bewertungen" })).not.toBeInTheDocument();
    await vi.waitFor(() => expect(
      queryClient.getQueryState(["admin-navigation-identity", "session-b"])?.status,
    ).toBe("error"));
    expect(screen.queryByRole("link", { name: "Bewertungen" })).not.toBeInTheDocument();
    identity.sessionId = "session-a";
    identity.signedIn = false;
    rerender();
    expect(screen.queryByRole("link", { name: "Bewertungen" })).not.toBeInTheDocument();
  });

  it("has no duplicate theme button and keeps the website action usable in the mobile drawer", () => {
    renderSidebar();

    expect(
      screen.queryByRole("button", { name: /Dark Mode|Light Mode/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open admin navigation" }),
    );
    const websiteLink = screen.getByRole("link", { name: "Zur Website" });
    expect(websiteLink).toBeVisible();
    fireEvent.click(websiteLink);
    expect(websiteLink).toHaveAttribute("href", "/");
  });
});
