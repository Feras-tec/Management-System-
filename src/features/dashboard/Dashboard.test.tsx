// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreferencesProvider } from "../../context";
import { getReportOverview, type ReportOverview } from "../reports/api";
import Dashboard, { dashboardErrorMessage } from "./Dashboard";

vi.mock("@tanstack/react-router", () => ({ useRouteContext: () => ({ auth: { getAccessToken: async () => "token" } }) }));
vi.mock("../reports/api", async (original) => ({ ...(await original<typeof import("../reports/api")>()), getReportOverview: vi.fn() }));
const data = { range: { preset: "last30", dateFrom: "2026-07-13", dateTo: "2026-08-11" }, timezone: "Europe/Berlin", currency: "EUR", sales: { completedCount: 4, revenueMinor: 12345, outstandingMinor: 2345 }, payments: { collectedMinor: 10000 }, bookings: { total: 3, upcoming: 2 }, customers: { total: 5 }, products: { lowStock: 7, outOfStock: 6, totalUnitsInStock: 9 }, employees: { byStatus: { ACTIVE: 2 } } } as ReportOverview;
function renderPage() { localStorage.setItem("language", "en"); const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<AppPreferencesProvider><QueryClientProvider client={client}><Dashboard /></QueryClientProvider></AppPreferencesProvider>); }
afterEach(() => { cleanup(); localStorage.clear(); }); beforeEach(() => vi.mocked(getReportOverview).mockReset());
describe("Dashboard analytics", () => {
  it("shows loading then real overview metrics in EUR", async () => { let resolve!: (value: ReportOverview) => void; vi.mocked(getReportOverview).mockReturnValue(new Promise((done) => { resolve = done; })); renderPage(); expect(screen.getByLabelText("Loading dashboard")).toBeVisible(); resolve(data); expect(await screen.findByText("€123.45")).toBeInTheDocument(); expect(screen.getByText("Low stock").nextSibling).toHaveTextContent("7"); expect(document.body.textContent).not.toContain("$"); });
  it("maps backend errors", () => { expect(dashboardErrorMessage(new Error("REPORTS_500"), false)).toBe("Dashboard could not be loaded."); });
  it("maps role denial", () => { expect(dashboardErrorMessage(new Error("REPORTS_FORBIDDEN"), false)).toBe("This overview is available to managers and administrators."); });
});
