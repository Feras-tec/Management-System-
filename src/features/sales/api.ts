import type { AccessTokenProvider } from "../../auth/auth";
export type SaleStatus = "DRAFT" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";
export interface SaleItem {
  id: string;
  type: "PRODUCT" | "SERVICE";
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}
export interface Payment {
  id: string;
  method: PaymentMethod;
  status: string;
  amountMinor: number;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
}
export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string | null;
  bookingId: string | null;
  status: SaleStatus;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  paidMinor: number;
  remainingMinor: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  soldAt: string | null;
  createdAt: string;
  items: SaleItem[];
  payments: Payment[];
  customer: { id: string; firstName: string; lastName: string } | null;
  booking: { id: string; bookingNumber: string; customerId: string } | null;
}
export interface SaleList {
  items: Sale[];
  total: number;
  page: number;
  limit: number;
}
interface BookingOption {
  id: string;
  bookingNumber: string;
  customer: { firstName: string; lastName: string };
  service: { id: string; nameDe: string; nameEn: string };
}
export type SaleBody = {
  customerId?: string | null;
  bookingId?: string | null;
  discountMinor: number;
  items: Array<
    | { type: "PRODUCT"; productId: string; quantity: number }
    | {
        type: "SERVICE";
        serviceId: string;
        quantity: number;
        unitPriceOverrideMinor?: number;
      }
  >;
};
const base = import.meta.env.VITE_API_BASE_URL;
function url(path: string) {
  if (!base) throw new Error("Missing VITE_API_BASE_URL.");
  return new URL(path, base);
}
async function request<T>(
  path: string,
  token: AccessTokenProvider,
  init?: RequestInit,
) {
  const value = await token();
  if (!value) throw new Error("AUTH_REQUIRED");
  const response = await fetch(url(path), {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: "Bearer " + value,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      error?: { code?: string };
    } | null;
    throw new Error(
      body?.error?.code ?? body?.code ?? "REQUEST_" + response.status,
    );
  }
  return response.json() as Promise<T>;
}
export const salesApi = {
  list: (token: AccessTokenProvider, q: string) =>
    request<SaleList>("/api/v1/sales?" + q, token),
  get: (token: AccessTokenProvider, id: string) =>
    request<Sale>("/api/v1/sales/" + id, token),
  create: (token: AccessTokenProvider, b: SaleBody) =>
    request<Sale>("/api/v1/sales", token, {
      method: "POST",
      body: JSON.stringify(b),
    }),
  update: (token: AccessTokenProvider, id: string, b: SaleBody) =>
    request<Sale>("/api/v1/sales/" + id, token, {
      method: "PATCH",
      body: JSON.stringify(b),
    }),
  complete: (token: AccessTokenProvider, id: string) =>
    request<Sale>("/api/v1/sales/" + id + "/complete", token, {
      method: "POST",
    }),
  cancel: (token: AccessTokenProvider, id: string) =>
    request<Sale>("/api/v1/sales/" + id + "/cancel", token, { method: "POST" }),
  payment: (
    token: AccessTokenProvider,
    id: string,
    b: {
      method: PaymentMethod;
      amountMinor: number;
      reference?: string | null;
    },
  ) =>
    request<Payment>("/api/v1/sales/" + id + "/payments", token, {
      method: "POST",
      body: JSON.stringify(b),
    }),
  summary: (token: AccessTokenProvider) =>
    request<{
      totalSales: number;
      revenueMinor: number;
      recent: Array<{
        id: string;
        saleNumber: string;
        status: SaleStatus;
        totalMinor: number;
        createdAt: string;
      }>;
    }>("/api/v1/sales/summary", token),
  products: (token: AccessTokenProvider) =>
    request<{
      items: Array<{
        id: string;
        name: string;
        sku: string;
        imageUrl: string | null;
        salePriceMinor: number;
        stockQuantity: number;
        minimumStock: number;
      }>;
    }>("/api/v1/products?page=1&limit=100&isActive=true", token),
  customers: (token: AccessTokenProvider) =>
    request<{
      items: Array<{ id: string; firstName: string; lastName: string }>;
    }>("/api/v1/customers?page=1&limit=100", token),
  bookings: (token: AccessTokenProvider) =>
    request<{ items: BookingOption[] }>(
      "/api/v1/bookings?page=1&limit=100",
      token,
    ),
  services: (token: AccessTokenProvider) =>
    request<
      Array<{
        id: string;
        nameDe: string;
        nameEn: string;
        priceFrom: number;
        isActive: boolean;
      }>
    >("/api/v1/services", token),
};
