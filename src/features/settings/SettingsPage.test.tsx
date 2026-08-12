// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppPreferencesProvider } from "../../context";
import { SettingsForm } from "./SettingsPage";
import type { BusinessSettings } from "./api";

const initial: BusinessSettings = {
  name: "AutoCare",
  currency: "EUR",
  locale: "de",
  timezone: "Europe/Berlin",
  taxRateBps: 1900,
  canEdit: true,
  openingHours: [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ].map((dayOfWeek, index) => ({
    dayOfWeek:
      dayOfWeek as BusinessSettings["openingHours"][number]["dayOfWeek"],
    isOpen: index < 6,
    openTime: index < 6 ? "08:00" : null,
    closeTime: index < 6 ? "18:00" : null,
  })),
};
afterEach(() => vi.unstubAllGlobals());
describe("SettingsForm", () => {
  it("sends the edited tax and complete settings when Save is clicked", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ ...initial, taxRateBps: 700 }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <AppPreferencesProvider>
          <SettingsForm
            initial={initial}
            token={async () => "test-token"}
            language="en"
          />
        </AppPreferencesProvider>
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Tax rate" }), {
      target: { value: "7.00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("PATCH");
    const payload = JSON.parse(String(init.body));
    expect(payload).toMatchObject({
      name: "AutoCare",
      taxRateBps: 700,
    });
    expect(payload).not.toHaveProperty("currency");
  });
});
