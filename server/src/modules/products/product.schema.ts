import { z } from "zod";

const sku = z.string().trim().min(1).max(64);
const money = z.number().int().min(0).max(2_147_483_647);
const stock = z.number().int().min(0).max(2_147_483_647);
const imageUrl = z.union([
  z.url().max(2_048),
  z.string().regex(/^\/products\/catalog\/[a-z0-9-]+\.webp$/),
]);

export const productCategories = [
  "WINDOW_FILM",
  "PPF",
  "WRAPPING_MATERIAL",
  "CLEANING_CHEMICAL",
  "DETAILING_CONSUMABLE",
  "INSTALLATION_TOOL",
  "SQUEEGEE",
  "KNIFE",
  "BLADE",
  "SPRAYER",
  "TAPE",
  "ACCESSORY",
  "OTHER",
] as const;

export const productCategorySchema = z.enum(productCategories);

const localizedText = z
  .object({
    de: z.string().trim().min(1).max(300),
    en: z.string().trim().min(1).max(300),
  })
  .strict();

export const productSpecificationsSchema = z
  .object({
    vltPercent: z.number().min(0).max(100).optional(),
    filmFamily: z.string().trim().min(1).max(100).optional(),
    rollWidthMm: z.number().int().positive().max(100_000).optional(),
    rollLengthMm: z.number().int().positive().max(10_000_000).optional(),
    thicknessMicrons: z.number().positive().max(100_000).optional(),
    intendedUse: localizedText.optional(),
    dimensions: z.string().trim().min(1).max(120).optional(),
    packSize: z.number().int().positive().max(1_000_000).optional(),
    material: z.string().trim().min(1).max(120).optional(),
    toolType: z.string().trim().min(1).max(120).optional(),
    volumeMl: z.number().int().positive().max(1_000_000).optional(),
    unit: z.enum(["ML", "L", "PIECE", "PACK", "ROLL"]).optional(),
  })
  .strict();

export const productIdParams = z
  .object({ productId: z.string().min(1) })
  .strict();

export const listProductsQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    category: productCategorySchema.optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    lowStock: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    sort: z
      .enum(["name", "sku", "stockQuantity", "salePriceMinor", "createdAt"])
      .default("name"),
    order: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

export const createProductSchema = z
  .object({
    sku,
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    category: productCategorySchema.default("OTHER"),
    imageUrl: imageUrl.nullable().optional(),
    specifications: productSpecificationsSchema.optional(),
    salePriceMinor: money,
    costPriceMinor: money.nullable().optional(),
    initialStock: stock.default(0),
    minimumStock: stock.default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

export const updateProductSchema = z
  .object({
    sku: sku.optional(),
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    category: productCategorySchema.optional(),
    imageUrl: imageUrl.nullable().optional(),
    specifications: productSpecificationsSchema.optional(),
    salePriceMinor: money.optional(),
    costPriceMinor: money.nullable().optional(),
    minimumStock: stock.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export const adjustInventorySchema = z
  .object({
    quantityDelta: z
      .number()
      .int()
      .min(-2_147_483_647)
      .max(2_147_483_647)
      .refine((value) => value !== 0),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export const historyQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ProductSpecifications = z.infer<typeof productSpecificationsSchema>;
