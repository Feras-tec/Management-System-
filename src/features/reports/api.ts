import type { AccessTokenProvider } from "../../auth/auth";

export type ReportRange = "today" | "last7" | "last30" | "thisMonth" | "custom";
export interface ReportOverview {
  range: { preset: ReportRange; dateFrom: string; dateTo: string };
  timezone: string;
  currency: "EUR";
  sales: { completedCount: number; cancelledCount: number; grossSubtotalMinor: number; discountsMinor: number; taxMinor: number; revenueMinor: number; paidMinor: number; outstandingMinor: number; averageSaleMinor: number; productRevenueMinor: number; serviceRevenueMinor: number };
  payments: { collectedMinor: number; byMethod: Record<"CASH" | "CARD" | "BANK_TRANSFER" | "OTHER", number> };
  bookings: { total: number; byStatus: Record<"PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW", number>; upcoming: number; completionRatePercent: number | null };
  customers: { total: number; newInRange: number; withBookings: number; withCompletedSales: number; top: Array<{ id: string; displayName: string; totalSpentMinor: number }> };
  products: { active: number; inactive: number; lowStock: number; outOfStock: number; totalUnitsInStock: number; knownCostValueMinor: number; productsWithoutCost: number; movementSummary: Record<string, number> };
  employees: { total: number; byStatus: Record<"ACTIVE" | "INACTIVE" | "ON_LEAVE", number>; linkedUsers: number; unlinkedEmployees: number; activeSystemAccess: number };
  services: Array<{ id: string; nameDe: string; nameEn: string; bookingCount: number; completedBookingCount: number; salesQuantity: number; revenueMinor: number }>;
  trends: Array<{ date: string; revenueMinor: number; salesCount: number; bookingsCount: number }>;
}

const base = import.meta.env.VITE_API_BASE_URL;
export async function getReportOverview(token: AccessTokenProvider, query: string): Promise<ReportOverview> {
  const value = await token();
  if (!value) throw new Error("AUTH_REQUIRED");
  if (!base) throw new Error("Missing VITE_API_BASE_URL.");
  const response = await fetch(new URL(`/api/v1/reports/overview?${query}`, base), { headers: { Authorization: `Bearer ${value}` } });
  if (!response.ok) throw new Error(response.status === 403 ? "REPORTS_FORBIDDEN" : `REPORTS_${response.status}`);
  return response.json() as Promise<ReportOverview>;
}
