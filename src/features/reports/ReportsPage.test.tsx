// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreferencesProvider } from "../../context";
import { getReportOverview, type ReportOverview } from "./api";
import ReportsPage, { reportsErrorMessage } from "./ReportsPage";

vi.mock("@tanstack/react-router", () => ({ useRouteContext: () => ({ auth: { getAccessToken: async () => "token" } }) }));
vi.mock("./api", async (original) => ({ ...(await original<typeof import("./api")>()), getReportOverview: vi.fn() }));
const data: ReportOverview = { range: { preset: "last30", dateFrom: "2026-07-13", dateTo: "2026-08-11" }, timezone: "Europe/Berlin", currency: "EUR", sales: { completedCount: 2, cancelledCount: 1, grossSubtotalMinor: 20000, discountsMinor: 1000, taxMinor: 3610, revenueMinor: 22610, paidMinor: 10000, outstandingMinor: 12610, averageSaleMinor: 11305, productRevenueMinor: 12000, serviceRevenueMinor: 8000 }, payments: { collectedMinor: 10000, byMethod: { CASH: 5000, CARD: 5000, BANK_TRANSFER: 0, OTHER: 0 } }, bookings: { total: 3, byStatus: { PENDING: 1, CONFIRMED: 0, IN_PROGRESS: 0, COMPLETED: 1, CANCELLED: 1, NO_SHOW: 0 }, upcoming: 1, completionRatePercent: 50 }, customers: { total: 4, newInRange: 1, withBookings: 2, withCompletedSales: 1, top: [{ id: "c1", displayName: "Ada Report", totalSpentMinor: 22610 }] }, products: { active: 20, inactive: 1, lowStock: 7, outOfStock: 6, totalUnitsInStock: 12, knownCostValueMinor: 4000, productsWithoutCost: 8, movementSummary: {} }, employees: { total: 3, byStatus: { ACTIVE: 2, INACTIVE: 0, ON_LEAVE: 1 }, linkedUsers: 2, unlinkedEmployees: 1, activeSystemAccess: 2 }, services: [{ id: "s1", nameDe: "Pflege", nameEn: "Detailing", bookingCount: 2, completedBookingCount: 1, salesQuantity: 1, revenueMinor: 8000 }], trends: [{ date: "2026-08-10", revenueMinor: 0, salesCount: 0, bookingsCount: 1 }, { date: "2026-08-11", revenueMinor: 22610, salesCount: 2, bookingsCount: 2 }] };
function renderPage(language: "de" | "en" = "en") { localStorage.setItem("language", language); const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<AppPreferencesProvider><QueryClientProvider client={client}><ReportsPage /></QueryClientProvider></AppPreferencesProvider>); }
afterEach(() => { cleanup(); localStorage.clear(); });
beforeEach(() => vi.mocked(getReportOverview).mockReset());

describe("ReportsPage", () => {
  it("renders PostgreSQL metrics, EUR and trend data without dollar formatting", async () => {
    vi.mocked(getReportOverview).mockResolvedValue(data); renderPage();
    expect(await screen.findByRole("heading", { name: "Reports" })).toBeVisible();
    expect((await screen.findAllByText("€226.10")).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Revenue trend").children).toHaveLength(2);
    expect(document.body.textContent).not.toContain("$");
    expect(screen.getByText("Low stock").nextSibling).toHaveTextContent("7");
    expect(screen.getByText("Detailing")).toBeVisible();
  });
  it("changes presets and waits for both custom dates", async () => {
    vi.mocked(getReportOverview).mockResolvedValue(data); const user = userEvent.setup(); renderPage(); await screen.findByText("Revenue trend");
    await user.selectOptions(screen.getByLabelText("Date range"), "last7");
    await waitFor(() => expect(getReportOverview).toHaveBeenCalledWith(expect.any(Function), "range=last7"));
    await user.selectOptions(screen.getByLabelText("Date range"), "custom");
    expect(screen.getByText("Choose both start and end dates.")).toBeVisible();
    await user.type(screen.getByLabelText("From"), "2026-08-01"); await user.type(screen.getByLabelText("To"), "2026-08-11");
    await waitFor(() => expect(getReportOverview).toHaveBeenCalledWith(expect.any(Function), "range=custom&dateFrom=2026-08-01&dateTo=2026-08-11"));
  });
  it("shows role denial and German labels", async () => {
    vi.mocked(getReportOverview).mockResolvedValue(data);
    renderPage("de");
    expect(await screen.findByText("Umsatztrend")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Berichte" })).toBeVisible();
    expect(reportsErrorMessage(new Error("REPORTS_FORBIDDEN"), true)).toBe("Keine Berechtigung für Berichte.");
    expect(reportsErrorMessage(new Error("REPORTS_500"), false)).toBe("Reports could not be loaded.");
  });
  it("supports an empty aggregate response", async () => {
    vi.mocked(getReportOverview).mockResolvedValue({ ...data, customers: { ...data.customers, top: [] }, services: [], trends: [] }); renderPage();
    expect(await screen.findByText("No trend data.")).toBeVisible();
    expect(screen.getByText("No services.")).toBeVisible();
  });
});
