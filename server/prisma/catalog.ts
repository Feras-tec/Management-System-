import type { PrismaClient } from "../src/generated/prisma/client.js";

export const catalogProducts = [
  {
    sku: "HP CHARCOAL 35",
    name: "High-Performance Charcoal Window Film 35% VLT",
    description:
      "Dyed and metallized automotive window film for professional installation.",
    category: "WINDOW_FILM",
    imageUrl: null,
    specifications: {
      vltPercent: 35,
      filmFamily: "High-performance charcoal",
      rollWidthMm: 1524,
      rollLengthMm: 30400,
      thicknessMicrons: 38.1,
      material: "Dyed and metallized film, 2-ply",
      unit: "ROLL",
      intendedUse: { de: "Fahrzeugscheiben", en: "Automotive windows" },
    },
  },
  {
    sku: "XFINITY 35",
    name: "Non-Metal Window Film 35% VLT",
    description:
      "Non-metal automotive window film for professional installation.",
    category: "WINDOW_FILM",
    imageUrl: null,
    specifications: {
      vltPercent: 35,
      filmFamily: "Non-metal",
      rollWidthMm: 1524,
      rollLengthMm: 30400,
      thicknessMicrons: 38.1,
      material: "Non-metal film, 2-ply",
      unit: "ROLL",
      intendedUse: { de: "Fahrzeugscheiben", en: "Automotive windows" },
    },
  },
  {
    sku: "GPS CS 35",
    name: "Carbon Color-Stable Window Film 35% VLT",
    description: "Non-metal carbon color-stable automotive window film.",
    category: "WINDOW_FILM",
    imageUrl: null,
    specifications: {
      vltPercent: 35,
      filmFamily: "Carbon color-stable",
      rollWidthMm: 1524,
      rollLengthMm: 30400,
      thicknessMicrons: 38.1,
      material: "Non-metal carbon film, 2-ply",
      unit: "ROLL",
      intendedUse: { de: "Fahrzeugscheiben", en: "Automotive windows" },
    },
  },
  {
    sku: "SUPER KOOL IR 70-80 CHARCOAL",
    name: "Nano-Ceramic Clear-View Window Film",
    description:
      "Non-metal nano-ceramic clear-view window film in a documented charcoal variant.",
    category: "WINDOW_FILM",
    imageUrl: null,
    specifications: {
      filmFamily: "Nano-ceramic clear-view charcoal 70-80",
      rollWidthMm: 1524,
      rollLengthMm: 30400,
      thicknessMicrons: 38.1,
      material: "Non-metal nano-ceramic film, 2-ply",
      unit: "ROLL",
      intendedUse: { de: "Gebaeudeverglasung", en: "Architectural glazing" },
    },
  },
  {
    sku: "T124",
    name: "Plastic Utility Knife",
    description:
      "Lightweight utility knife for film pattern cutting and trimming.",
    category: "KNIFE",
    imageUrl: null,
    specifications: {
      toolType: "Utility knife",
      material: "Plastic",
      unit: "PIECE",
    },
  },
  {
    sku: "T033",
    name: "Flexible Detail Squeegee",
    description:
      "Flexible detail squeegee for tight corners and work around gaskets.",
    category: "SQUEEGEE",
    imageUrl: "/products/catalog/flexible-detail-squeegee.webp",
    specifications: {
      toolType: "Detail squeegee",
      material: "Flexible polymer",
      unit: "PIECE",
    },
  },
  {
    sku: "T066",
    name: "Clear General-Purpose Squeegee, 6 in",
    description:
      "General-purpose clear squeegee for pressure smoothing during installation.",
    category: "SQUEEGEE",
    imageUrl: "/products/catalog/clear-squeegee-6in.webp",
    specifications: {
      dimensions: "6 in",
      toolType: "General-purpose squeegee",
      unit: "PIECE",
    },
  },
  {
    sku: "T2017",
    name: "Filament Cutting Tape",
    description:
      "High-strength filament tape for clean cuts without scratching painted surfaces.",
    category: "TAPE",
    imageUrl: "/products/catalog/filament-cutting-tape.webp",
    specifications: { toolType: "Filament cutting tape", unit: "ROLL" },
  },
  {
    sku: "T132",
    name: "Gasket Hook Tool",
    description:
      "Hook tool for pulling back rubber gaskets during film installation.",
    category: "INSTALLATION_TOOL",
    imageUrl: "/products/catalog/gasket-hook-tool.webp",
    specifications: { toolType: "Gasket hook", unit: "PIECE" },
  },
  {
    sku: "T190",
    name: "Five-Way Trim Guide",
    description: "Multi-edge trim guide that can also be used as a bump tool.",
    category: "INSTALLATION_TOOL",
    imageUrl: "/products/catalog/five-way-trim-guide.webp",
    specifications: { toolType: "Five-way trim guide", unit: "PIECE" },
  },
  {
    sku: "T2081B",
    name: "Edge-Finishing Squeegee with Black Mat",
    description: "Medium-mat edge-finishing squeegee for installation work.",
    category: "SQUEEGEE",
    imageUrl: "/products/catalog/edge-finishing-squeegee.webp",
    specifications: {
      toolType: "Edge-finishing squeegee",
      material: "Polymer and black mat",
      unit: "PIECE",
    },
  },
  {
    sku: "T098N",
    name: "High-Output Trigger Sprayer",
    description:
      "Ergonomic high-output trigger sprayer with a durable pickup tube.",
    category: "SPRAYER",
    imageUrl: null,
    specifications: { toolType: "Trigger sprayer", unit: "PIECE" },
  },
  {
    sku: "T070",
    name: "Low-Lint Cleaning Wipes",
    description:
      "Two-ply low-lint center-pull cleaning wipes supplied as a roll.",
    category: "ACCESSORY",
    imageUrl: "/products/catalog/low-lint-cleaning-wipes.webp",
    specifications: {
      dimensions: "6 in x 605 ft",
      packSize: 660,
      material: "Two-ply low-lint wipe",
      unit: "ROLL",
    },
  },
] as const;

export const representativeProducts = catalogProducts;

export async function seedRepresentativeCatalog(
  prisma: PrismaClient,
  businessId: string,
) {
  let created = 0;
  for (const product of catalogProducts) {
    const existing = await prisma.product.findUnique({
      where: { businessId_sku: { businessId, sku: product.sku } },
      select: { id: true },
    });
    const metadata = {
      name: product.name,
      description: product.description,
      category: product.category,
      imageUrl: product.imageUrl,
      specifications: product.specifications,
    };
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: metadata,
      });
      continue;
    }
    await prisma.product.create({
      data: {
        businessId,
        sku: product.sku,
        ...metadata,
        salePriceMinor: 0,
        costPriceMinor: null,
        stockQuantity: 0,
        minimumStock: 0,
        isActive: true,
      },
    });
    created += 1;
  }
  return created;
}
