import type { AccessTokenProvider } from "../../auth/auth";

export const productCategories = [
  "WINDOW_FILM", "PPF", "WRAPPING_MATERIAL", "CLEANING_CHEMICAL",
  "DETAILING_CONSUMABLE", "INSTALLATION_TOOL", "SQUEEGEE", "KNIFE",
  "BLADE", "SPRAYER", "TAPE", "ACCESSORY", "OTHER",
] as const;
export type ProductCategory = (typeof productCategories)[number];

export interface ProductSpecifications {
  vltPercent?: number;
  filmFamily?: string;
  rollWidthMm?: number;
  rollLengthMm?: number;
  thicknessMicrons?: number;
  intendedUse?: { de: string; en: string };
  dimensions?: string;
  packSize?: number;
  material?: string;
  toolType?: string;
  volumeMl?: number;
  unit?: "ML" | "L" | "PIECE" | "PACK" | "ROLL";
}

export interface Product {
  id: string; sku: string; name: string; description: string | null;
  category: ProductCategory; imageUrl: string | null;
  specifications: ProductSpecifications | null;
  salePriceMinor: number; costPriceMinor: number | null;
  stockQuantity: number; minimumStock: number; isActive: boolean;
  lowStock: boolean; createdAt: string; updatedAt: string;
}
export interface ProductList { items: Product[]; total: number; page: number; limit: number }
export interface Movement {
  id: string; type: "INITIAL"|"PURCHASE"|"SALE"|"ADJUSTMENT"|"RETURN"|"DAMAGE"|"CANCELLATION";
  quantityDelta: number; quantityBefore: number; quantityAfter: number; reason: string | null;
  referenceType: string | null; referenceId: string | null; createdAt: string;
  createdByUser: { id: string; role: string } | null;
}

const base = import.meta.env.VITE_API_BASE_URL;
function url(path: string) {
  if (!base) throw new Error("Missing VITE_API_BASE_URL.");
  return new URL(path, base);
}
async function request<T>(path: string, token: AccessTokenProvider, init?: RequestInit) {
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
    const body = await response.json().catch(() => null) as { code?: string; error?: { code?: string } } | null;
    throw new Error(body?.error?.code ?? body?.code ?? "REQUEST_" + response.status);
  }
  return response.json() as Promise<T>;
}
export const productApi = {
  list: (token: AccessTokenProvider, query: string) => request<ProductList>("/api/v1/products?" + query, token),
  get: (token: AccessTokenProvider, id: string) => request<Product>("/api/v1/products/" + id, token),
  create: (token: AccessTokenProvider, body: unknown) => request<Product>("/api/v1/products", token, { method: "POST", body: JSON.stringify(body) }),
  update: (token: AccessTokenProvider, id: string, body: unknown) => request<Product>("/api/v1/products/" + id, token, { method: "PATCH", body: JSON.stringify(body) }),
  deactivate: (token: AccessTokenProvider, id: string) => request<Product>("/api/v1/products/" + id, token, { method: "DELETE" }),
  adjust: (token: AccessTokenProvider, id: string, body: { quantityDelta: number; reason: string }) => request<Product>("/api/v1/products/" + id + "/inventory/adjust", token, { method: "POST", body: JSON.stringify(body) }),
  history: (token: AccessTokenProvider, id: string, page = 1) => request<{ items: Movement[]; total: number; page: number; limit: number }>("/api/v1/products/" + id + "/inventory?page=" + page + "&limit=20", token),
};
