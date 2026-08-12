// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Sidebar from "./Sidebar";
import { AppPreferencesProvider, useAppPreferences } from "../../../context";

vi.mock("@tanstack/react-router", () => ({
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
  return render(
    <AppPreferencesProvider>
      <LanguageHarness />
    </AppPreferencesProvider>,
  );
}

const germanLabels = [
  "Dashboard",
  "Buchungen",
  "Mitarbeiter",
  "Produkte",
  "Kunden",
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
  "Sales",
  "Reports",
  "Settings",
];

describe("Sidebar navigation", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    localStorage.setItem("language", "de");
  });

  it("renders all German labels and the website link", () => {
    renderSidebar();

    for (const label of germanLabels) {
      expect(screen.getByText(label, { exact: true })).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "Zur Website" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("updates all labels immediately when language changes", () => {
    renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));

    for (const label of englishLabels) {
      expect(screen.getByText(label, { exact: true })).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "Go to Website" })).toHaveAttribute(
      "href",
      "/",
    );
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
