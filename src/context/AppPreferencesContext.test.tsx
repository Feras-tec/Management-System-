// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AppPreferencesProvider,
  useAppPreferences,
} from "./AppPreferencesContext";

function ThemeControls() {
  const { theme, language, toggleTheme, toggleLanguage } = useAppPreferences();

  return (
    <>
      <output aria-label="active theme">{theme}</output>
      <button type="button" onClick={toggleTheme}>
        Toggle theme
      </button>
      <output aria-label="active language">{language}</output>
      <button type="button" onClick={toggleLanguage}>
        Toggle language
      </button>
    </>
  );
}

function renderThemeControls() {
  return render(
    <AppPreferencesProvider>
      <ThemeControls />
    </AppPreferencesProvider>,
  );
}

describe("AppPreferencesProvider theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("toggles light to dark and back while updating the document and storage", async () => {
    const user = userEvent.setup();
    renderThemeControls();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "light");
    });

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(screen.getByLabelText("active theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(screen.getByLabelText("active theme")).toHaveTextContent("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("restores the persisted dark theme after remount", async () => {
    localStorage.setItem("theme", "dark");

    const view = renderThemeControls();
    expect(screen.getByLabelText("active theme")).toHaveTextContent("dark");
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    });

    view.unmount();
    renderThemeControls();

    expect(screen.getByLabelText("active theme")).toHaveTextContent("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("keeps the document language in sync with the selected language", async () => {
    const user = userEvent.setup();
    renderThemeControls();

    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("lang", "de"),
    );
    await user.click(screen.getByRole("button", { name: "Toggle language" }));

    expect(screen.getByLabelText("active language")).toHaveTextContent("en");
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(localStorage.getItem("language")).toBe("en");
  });
});
