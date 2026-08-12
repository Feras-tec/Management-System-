// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreferencesProvider } from "../../context";
import { salesApi, type Sale } from "./api";
import { SalesPageView } from "./SalesPage";
vi.mock("framer-motion", async (original) => ({
  ...(await original<typeof import("framer-motion")>()),
  useReducedMotion: () => true,
}));
afterEach(cleanup);
const token = async () => "session";
const draft: Sale = {
  id: "s1",
  saleNumber: "SALE-2026-ABC",
  customerId: null,
  bookingId: null,
  status: "DRAFT",
  currency: "EUR",
  subtotalMinor: 1000,
  discountMinor: 0,
  taxMinor: 190,
  totalMinor: 1190,
  paidMinor: 0,
  remainingMinor: 1190,
  paymentStatus: "UNPAID",
  soldAt: null,
  createdAt: "2026-08-11T10:00:00Z",
  items: [
    {
      id: "i1",
      type: "PRODUCT",
      productId: "p1",
      serviceId: null,
      description: "Product",
      quantity: 1,
      unitPriceMinor: 1000,
      lineTotalMinor: 1000,
    },
  ],
  payments: [],
  customer: null,
  booking: null,
};
function renderPage() {
  localStorage.setItem("language", "en");
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <AppPreferencesProvider>
      <QueryClientProvider client={qc}>
        <SalesPageView token={token} />
      </QueryClientProvider>
    </AppPreferencesProvider>,
  );
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(salesApi, "list").mockResolvedValue({
    items: [draft],
    total: 1,
    page: 1,
    limit: 10,
  });
  vi.spyOn(salesApi, "products").mockResolvedValue({
    items: [
      {
        id: "p1",
        name: "Product",
        sku: "P1",
        imageUrl: "/products/catalog/product.webp",
        salePriceMinor: 1000,
        stockQuantity: 5,
        minimumStock: 1,
      },
      {
        id: "p2",
        name: "Unpriced Product",
        sku: "P2",
        imageUrl: null,
        salePriceMinor: 0,
        stockQuantity: 5,
        minimumStock: 1,
      },
    ],
  });
  vi.spyOn(salesApi, "services").mockResolvedValue([
    {
      id: "v1",
      nameDe: "Service",
      nameEn: "Service",
      priceFrom: 2000,
      isActive: true,
    },
  ]);
  vi.spyOn(salesApi, "customers").mockResolvedValue({ items: [] });
  vi.spyOn(salesApi, "bookings").mockResolvedValue({ items: [] });
  vi.spyOn(salesApi, "create").mockResolvedValue(draft);
  vi.spyOn(salesApi, "complete").mockResolvedValue({
    ...draft,
    status: "COMPLETED",
    soldAt: "2026-08-11T11:00:00Z",
  });
  vi.spyOn(salesApi, "cancel").mockResolvedValue({
    ...draft,
    status: "CANCELLED",
  });
  vi.spyOn(salesApi, "payment").mockResolvedValue({
    id: "pay",
    method: "CASH",
    status: "COMPLETED",
    amountMinor: 500,
    reference: null,
    paidAt: null,
    createdAt: "2026-08-11",
  });
});
describe("SalesPage", () => {
  it("shows loading, list data and low-level status", async () => {
    let resolve: (v: {
      items: Sale[];
      total: number;
      page: number;
      limit: number;
    }) => void = () => {};
    vi.spyOn(salesApi, "list").mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    renderPage();
    expect(screen.getByRole("status")).toBeVisible();
    resolve({ items: [draft], total: 1, page: 1, limit: 10 });
    expect(await screen.findByText("SALE-2026-ABC")).toBeVisible();
    expect(screen.getByText("Unpaid")).toBeVisible();
  });
  it("shows error and empty states", async () => {
    vi.spyOn(salesApi, "list").mockRejectedValueOnce(new Error("FAIL"));
    renderPage();
    expect(await screen.findByText("Sales could not be loaded.")).toBeVisible();
    cleanup();
    vi.spyOn(salesApi, "list").mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    renderPage();
    expect(await screen.findByText("No sales found.")).toBeVisible();
  });
  it("validates and creates a multiple-item draft with estimated totals", async () => {
    renderPage();
    const u = userEvent.setup();
    await screen.findByText("SALE-2026-ABC");
    await u.click(screen.getByRole("button", { name: "Create sale" }));
    const unpriced = screen.getByRole("option", {
      name: /Unpriced Product · P2 · Unpriced/,
    });
    expect(unpriced).toBeDisabled();
    await u.click(screen.getByRole("button", { name: "Save draft" }));
    expect(
      screen.getByText("Please check all fields and items."),
    ).toBeVisible();
    await u.selectOptions(
      screen.getByRole("combobox", { name: "Item 1" }),
      "p1",
    );
    expect(screen.getByAltText("Product")).toHaveAttribute(
      "src",
      "/products/catalog/product.webp",
    );
    await u.click(screen.getByRole("button", { name: "Add item" }));
    await u.selectOptions(
      screen.getByRole("combobox", { name: "Type 2" }),
      "SERVICE",
    );
    await u.selectOptions(
      screen.getByRole("combobox", { name: "Item 2" }),
      "v1",
    );
    expect(screen.getByText(/Estimated subtotal: €30.00/)).toBeVisible();
    await u.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(salesApi.create).toHaveBeenCalledWith(
        token,
        expect.objectContaining({
          items: [
            { type: "PRODUCT", productId: "p1", quantity: 1 },
            { type: "SERVICE", serviceId: "v1", quantity: 1 },
          ],
        }),
      ),
    );
  });
  it("completes a draft and displays insufficient stock errors", async () => {
    renderPage();
    const u = userEvent.setup();
    await screen.findByText("SALE-2026-ABC");
    await u.click(screen.getByRole("button", { name: "Details" }));
    vi.mocked(salesApi.complete).mockRejectedValueOnce(
      new Error("INSUFFICIENT_STOCK"),
    );
    await u.click(screen.getByRole("button", { name: "Complete sale" }));
    await u.click(screen.getByRole("button", { name: "Confirm completion" }));
    expect(await screen.findByText("Insufficient stock.")).toBeVisible();
  });
  it("records a manual payment and confirms cancellation separately", async () => {
    const completed = {
      ...draft,
      status: "COMPLETED" as const,
      soldAt: "2026-08-11",
      remainingMinor: 1190,
    };
    vi.spyOn(salesApi, "list").mockResolvedValueOnce({
      items: [completed],
      total: 1,
      page: 1,
      limit: 10,
    });
    renderPage();
    const u = userEvent.setup();
    await screen.findByText("SALE-2026-ABC");
    await u.click(screen.getByRole("button", { name: "Details" }));
    await u.click(screen.getByRole("button", { name: "Record payment" }));
    await u.type(screen.getByRole("spinbutton", { name: "Amount" }), "5");
    const buttons = screen.getAllByRole("button", { name: "Record payment" });
    await u.click(buttons[0]!);
    await waitFor(() =>
      expect(salesApi.payment).toHaveBeenCalledWith(token, "s1", {
        method: "CASH",
        amountMinor: 500,
        reference: null,
      }),
    );
    cleanup();
    vi.spyOn(salesApi, "list").mockResolvedValueOnce({
      items: [completed],
      total: 1,
      page: 1,
      limit: 10,
    });
    renderPage();
    await screen.findByText("SALE-2026-ABC");
    await u.click(screen.getByRole("button", { name: "Details" }));
    await u.click(screen.getByRole("button", { name: "Cancel sale" }));
    expect(screen.getByText(/Products will be restored/)).toBeVisible();
    await u.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    await waitFor(() => expect(salesApi.cancel).toHaveBeenCalled());
  });
});
