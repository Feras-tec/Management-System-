import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { PrismaDataStore } from "../src/database/prisma.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const store = testDatabaseUrl ? new PrismaDataStore(testDatabaseUrl) : null;
const suffix = randomUUID();
const businessId = `test-business-${suffix}`;
const clerkUserId = `test-clerk-${suffix}`;

afterAll(async () => {
  if (!store) return;
  await store.client.service.deleteMany({ where: { businessId } });
  await store.client.user.deleteMany({ where: { businessId } });
  await store.client.business.deleteMany({ where: { id: businessId } });
  await store.disconnect();
});

describe.skipIf(!testDatabaseUrl)("PostgreSQL integration", () => {
  it("enforces user uniqueness and service business scoping", async () => {
    if (!store) throw new Error("TEST_DATABASE_URL is required.");
    await store.client.business.create({
      data: { id: businessId, name: "Integration Test", slug: `test-${suffix}` },
    });
    await store.client.user.create({
      data: { clerkUserId, businessId, role: "ADMIN" },
    });
    await expect(
      store.client.user.create({
        data: { clerkUserId, businessId, role: "EMPLOYEE" },
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    const service = await store.createService({
      businessId,
      slug: "integration-service",
      nameDe: "Integration",
      nameEn: "Integration",
      shortDescriptionDe: "Beschreibung für Integration.",
      shortDescriptionEn: "Integration test description.",
      descriptionDe: "Beschreibung für den Integrationstest.",
      descriptionEn: "Description for the integration test.",
      priceFrom: 10_000,
      durationMinutes: 60,
      imageUrl: null,
      isActive: true,
      sortOrder: 1,
    });
    expect(await store.findService(businessId, service.id)).not.toBeNull();
    expect(await store.findService("another-business", service.id)).toBeNull();
    expect((await store.updateService(businessId, service.id, { isActive: false }))?.isActive).toBe(false);
  });
});
