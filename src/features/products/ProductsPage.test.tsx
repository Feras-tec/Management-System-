// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreferencesProvider } from "../../context";
import { productApi, type Product } from "./api";
import { productFormSchema, ProductsPage, toMinor } from "./ProductsPage";
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => true,
}));
afterEach(cleanup);
const token = async () => "session";
const product: Product = {
  id: "p1",
  sku: "CARE-1",
  name: "Care Product",
  description: "Detail",
  category: "DETAILING_CONSUMABLE",
  imageUrl: null,
  specifications: { material: "Microfiber" },
  salePriceMinor: 1299,
  costPriceMinor: 500,
  stockQuantity: 2,
  minimumStock: 3,
  isActive: true,
  lowStock: true,
  createdAt: "2026-08-11T10:00:00Z",
  updatedAt: "2026-08-11T10:00:00Z",
};
function renderPage() {
  localStorage.setItem("language", "en");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <AppPreferencesProvider>
      <QueryClientProvider client={client}>
        <ProductsPage token={token} />
      </QueryClientProvider>
    </AppPreferencesProvider>,
  );
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(productApi, "list").mockResolvedValue({
    items: [product],
    total: 12,
    page: 1,
    limit: 10,
  });
  vi.spyOn(productApi, "deactivate").mockResolvedValue({
    ...product,
    isActive: false,
  });
  vi.spyOn(productApi, "adjust").mockResolvedValue({
    ...product,
    stockQuantity: 3,
  });
  vi.spyOn(productApi, "history").mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
  });
});
describe("ProductsPage", () => {
  it("shows loading then low-stock data and sends search/pagination filters", async () => {
    let resolveList: (value: {
      items: Product[];
      total: number;
      page: number;
      limit: number;
    }) => void = () => {};
    vi.spyOn(productApi, "list").mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    );
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
    resolveList({ items: [product], total: 12, page: 1, limit: 10 });
    expect((await screen.findAllByText("Care Product"))[0]).toBeVisible();
    expect(screen.getAllByText("2 / 3")[0]).toHaveClass("badge-warning");
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText("Search name, SKU or category"),
      "care",
    );
    await waitFor(() =>
      expect(productApi.list).toHaveBeenLastCalledWith(
        token,
        expect.stringContaining("search=care"),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(productApi.list).toHaveBeenLastCalledWith(
        token,
        expect.stringContaining("page=2"),
      ),
    );
  });
  it("shows error and empty states", async () => {
    vi.spyOn(productApi, "list").mockRejectedValueOnce(new Error("FAIL"));
    renderPage();
    expect(
      await screen.findByText("Products could not be loaded."),
    ).toBeVisible();
    cleanup();
    vi.spyOn(productApi, "list").mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    renderPage();
    expect(await screen.findByText("No products found.")).toBeVisible();
  });
  it("validates create form and edit never exposes stock metadata", async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findAllByText("Care Product");
    await user.click(screen.getByRole("button", { name: "Create product" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      screen.getByText("Please check SKU, name, prices and inventory values."),
    ).toBeVisible();
    expect(screen.getByText("Initial stock")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    expect(screen.queryByText("Initial stock")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("2")).not.toBeInTheDocument();
  });
  it("blocks negative inventory and submits a valid adjustment separately", async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findAllByText("Care Product");
    await user.click(
      screen.getAllByRole("button", { name: "Inventory" })[0],
    );
    const change = screen.getByRole("spinbutton", { name: "Quantity change" });
    await user.type(change, "-3");
    await user.type(screen.getByRole("textbox", { name: "Reason" }), "Damage");
    expect(screen.getByText("Stock cannot become negative.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Adjust" })).toBeDisabled();
    await user.clear(change);
    await user.type(change, "1");
    await user.click(screen.getByRole("button", { name: "Adjust" }));
    await waitFor(() =>
      expect(productApi.adjust).toHaveBeenCalledWith(token, "p1", {
        quantityDelta: 1,
        reason: "Damage",
      }),
    );
  });
});
describe("product form money", () => {
  it("converts euros to integer minor units and rejects invalid stock", () => {
    expect(toMinor(12.99)).toBe(1299);
    expect(
      productFormSchema.safeParse({
        sku: "A",
        name: "A",
        description: "",
        category: "OTHER",
        imageUrl: "",
        vltPercent: "",
        dimensions: "",
        packSize: "",
        material: "",
        volumeMl: "",
        intendedUseDe: "",
        intendedUseEn: "",
        salePriceEuros: "1.00",
        costPriceEuros: "",
        initialStock: "-1",
        minimumStock: "0",
        isActive: true,
      }).success,
    ).toBe(false);
  });
  it("accepts safe local catalog image paths", () => {
    const base = {
      sku: "A",
      name: "A",
      description: "",
      category: "OTHER",
      vltPercent: "",
      dimensions: "",
      packSize: "",
      material: "",
      volumeMl: "",
      intendedUseDe: "",
      intendedUseEn: "",
      salePriceEuros: "0",
      costPriceEuros: "",
      initialStock: "0",
      minimumStock: "0",
      isActive: true,
    };
    expect(
      productFormSchema.safeParse({
        ...base,
        imageUrl: "/products/catalog/plastic-utility-knife.webp",
      }).success,
    ).toBe(true);
    expect(
      productFormSchema.safeParse({
        ...base,
        imageUrl: "/products/catalog/../../secret.webp",
      }).success,
    ).toBe(false);
  });
});
