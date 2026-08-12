import type { Prisma } from "../../generated/prisma/client.js";
import type { ProductSpecifications } from "./product.schema.js";

export type MovementType = "INITIAL" | "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN" | "DAMAGE" | "CANCELLATION";
export type ProductCategory =
  | "WINDOW_FILM" | "PPF" | "WRAPPING_MATERIAL" | "CLEANING_CHEMICAL"
  | "DETAILING_CONSUMABLE" | "INSTALLATION_TOOL" | "SQUEEGEE" | "KNIFE"
  | "BLADE" | "SPRAYER" | "TAPE" | "ACCESSORY" | "OTHER";

export interface ProductRecord {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  specifications: Prisma.JsonValue | null;
  salePriceMinor: number;
  costPriceMinor: number | null;
  stockQuantity: number;
  minimumStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListInput {
  businessId: string;
  page: number;
  limit: number;
  search?: string;
  category?: ProductCategory | undefined;
  isActive?: boolean | undefined;
  lowStock?: boolean | undefined;
  sort: "name" | "sku" | "stockQuantity" | "salePriceMinor" | "createdAt";
  order: "asc" | "desc";
}

export interface CreateProductInput {
  businessId: string;
  sku: string;
  name: string;
  description?: string | null | undefined;
  category: ProductCategory;
  imageUrl?: string | null | undefined;
  specifications?: ProductSpecifications | undefined;
  salePriceMinor: number;
  costPriceMinor?: number | null | undefined;
  initialStock: number;
  minimumStock: number;
  isActive: boolean;
  createdByUserId: string;
}

export interface UpdateProductInput {
  name?: string | undefined;
  sku?: string | undefined;
  description?: string | null | undefined;
  category?: ProductCategory | undefined;
  imageUrl?: string | null | undefined;
  specifications?: ProductSpecifications | undefined;
  salePriceMinor?: number | undefined;
  costPriceMinor?: number | null | undefined;
  minimumStock?: number | undefined;
  isActive?: boolean | undefined;
}

export interface ProductStore {
  list(input: ProductListInput): Promise<{ items: ProductRecord[]; total: number }>;
  find(businessId: string, id: string): Promise<ProductRecord | null>;
  create(input: CreateProductInput): Promise<ProductRecord>;
  update(businessId: string, id: string, input: UpdateProductInput): Promise<ProductRecord | null>;
  deactivate(businessId: string, id: string): Promise<ProductRecord | null>;
  adjust(businessId: string, id: string, delta: number, reason: string | null, actorId: string): Promise<ProductRecord>;
  history(businessId: string, id: string, page: number, limit: number): Promise<{
    items: Array<{
      id: string; type: MovementType; quantityDelta: number; quantityBefore: number;
      quantityAfter: number; reason: string | null; referenceType: string | null;
      referenceId: string | null; createdAt: Date;
      createdByUser: { id: string; role: "ADMIN" | "MANAGER" | "EMPLOYEE" } | null;
    }>;
    total: number;
  }>;
}
