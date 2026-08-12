import { access } from "node:fs/promises";
import { resolve } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  catalogProducts,
  seedRepresentativeCatalog,
} from "../prisma/catalog.js";
import { PrismaClient } from "../src/generated/prisma/client.js";

const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "TEST_DATABASE_URL is required; catalog integration tests must not be skipped.",
  );

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const suffix = Date.now().toString(36);
const expectedSkus = [
  "HP CHARCOAL 35",
  "XFINITY 35",
  "GPS CS 35",
  "SUPER KOOL IR 70-80 CHARCOAL",
  "T124",
  "T033",
  "T066",
  "T2017",
  "T132",
  "T190",
  "T2081B",
  "T098N",
  "T070",
] as const;
let businessId = "";

beforeAll(async () => {
  const business = await prisma.business.create({
    data: { name: "Catalog Test", slug: "catalog-" + suffix },
  });
  businessId = business.id;
  await prisma.product.create({
    data: {
      businessId,
      sku: expectedSkus[0],
      name: "Existing operational item",
      category: "OTHER",
      salePriceMinor: 777,
      costPriceMinor: 333,
      stockQuantity: 4,
      minimumStock: 2,
      isActive: false,
    },
  });
});

afterAll(async () => {
  await prisma.inventoryMovement.deleteMany({ where: { businessId } });
  await prisma.product.deleteMany({ where: { businessId } });
  await prisma.business.deleteMany({ where: { id: businessId } });
  await prisma.$disconnect();
});

describe("approved product catalog seed", () => {
  it("contains exactly the approved 13 SKUs and safe catalog image paths", async () => {
    expect(catalogProducts.map((product) => product.sku)).toEqual(expectedSkus);
    expect(new Set(expectedSkus).size).toBe(13);

    for (const product of catalogProducts) {
      expect(product.name + " " + product.description).not.toMatch(
        /xsun|windowfilms\.com|factory direct/i,
      );
      expect(product.name + " " + product.description).not.toMatch(
        /\$|\bUSD\b/i,
      );
      if (product.imageUrl) {
        expect(product.imageUrl).toMatch(
          /^\/products\/catalog\/[a-z0-9-]+\.webp$/,
        );
        expect(product.imageUrl).not.toMatch(/xsun|supplier|factory/i);
        await expect(
          access(
            resolve(process.cwd(), "..", "public", product.imageUrl.slice(1)),
          ),
        ).resolves.toBeUndefined();
      }
    }
  });

  it("is idempotent and only updates metadata on an existing operational product", async () => {
    expect(await seedRepresentativeCatalog(prisma, businessId)).toBe(12);
    expect(await seedRepresentativeCatalog(prisma, businessId)).toBe(0);

    const products = await prisma.product.findMany({
      where: { businessId },
      orderBy: { sku: "asc" },
    });
    expect(products).toHaveLength(13);
    expect(products.map((product) => product.sku).sort()).toEqual(
      [...expectedSkus].sort(),
    );

    const existing = await prisma.product.findUniqueOrThrow({
      where: { businessId_sku: { businessId, sku: expectedSkus[0] } },
    });
    expect(existing).toMatchObject({
      name: "High-Performance Charcoal Window Film 35% VLT",
      category: "WINDOW_FILM",
      salePriceMinor: 777,
      costPriceMinor: 333,
      stockQuantity: 4,
      minimumStock: 2,
      isActive: false,
    });

    const created = products.filter((product) => product.id !== existing.id);
    expect(
      created.every(
        (product) =>
          product.salePriceMinor === 0 && product.costPriceMinor === null,
      ),
    ).toBe(true);
    expect(created.every((product) => product.stockQuantity === 0)).toBe(true);
    expect(
      await prisma.inventoryMovement.count({ where: { businessId } }),
    ).toBe(0);
  });

  it("keeps window film as inventory-capable products and window tinting as a stockless service", async () => {
    const films = await prisma.product.findMany({
      where: { businessId, category: "WINDOW_FILM" },
    });
    expect(films).toHaveLength(4);
    expect(
      films.find((film) => film.sku === expectedSkus[0])?.stockQuantity,
    ).toBe(4);
    expect(
      films
        .filter((film) => film.sku !== expectedSkus[0])
        .every((film) => film.stockQuantity === 0),
    ).toBe(true);

    const service = await prisma.service.create({
      data: {
        businessId,
        slug: "window-tinting-" + suffix,
        nameDe: "Scheibentoenung",
        nameEn: "Window Tinting",
        shortDescriptionDe: "Service",
        shortDescriptionEn: "Service",
        descriptionDe: "Service",
        descriptionEn: "Service",
        priceFrom: 0,
        durationMinutes: 60,
      },
    });
    expect(service).not.toHaveProperty("stockQuantity");
    await prisma.service.delete({ where: { id: service.id } });
  });
});
