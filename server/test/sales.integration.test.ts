import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/build-app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import { PrismaDataStore } from "../src/database/prisma.js";
import type { AuthProvider } from "../src/shared/auth/auth-provider.js";
const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "TEST_DATABASE_URL is required; sales integration tests must not be skipped.",
  );
const store = new PrismaDataStore(url);
const suffix = Date.now().toString(36);
let app: Awaited<ReturnType<typeof buildApp>>;
let businessId = "";
let otherBusinessId = "";
let productId = "";
let serviceId = "";
let customerId = "";
let bookingId = "";
const adminClerk = "sales-admin-" + suffix;
const employeeClerk = "sales-employee-" + suffix;
const otherClerk = "sales-other-" + suffix;
const environment: ServerEnvironment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3997,
  LOG_LEVEL: "silent",
  FRONTEND_ORIGIN: "http://localhost:5173",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  CLERK_SECRET_KEY: "sk_test_placeholder",
  DATABASE_URL: url,
};
const auth: AuthProvider = {
  getIdentity(req) {
    const id = req.headers["x-test-user-id"];
    return typeof id === "string"
      ? { userId: id, sessionId: "test", organizationId: null }
      : null;
  },
};
const headers = (id = adminClerk) => ({ "x-test-user-id": id });
beforeAll(async () => {
  const b = await store.client.business.create({
    data: { name: "Sales Test", slug: "sales-" + suffix },
  });
  businessId = b.id;
  const ob = await store.client.business.create({
    data: { name: "Sales Other", slug: "sales-other-" + suffix },
  });
  otherBusinessId = ob.id;
  await store.client.user.create({
    data: { businessId, clerkUserId: adminClerk, role: "ADMIN" },
  });
  await store.client.user.create({
    data: { businessId, clerkUserId: employeeClerk, role: "EMPLOYEE" },
  });
  await store.client.user.create({
    data: {
      businessId: otherBusinessId,
      clerkUserId: otherClerk,
      role: "ADMIN",
    },
  });
  productId = (
    await store.client.product.create({
      data: {
        businessId,
        sku: "SALE-" + suffix,
        name: "Sale Product",
        salePriceMinor: 1000,
        stockQuantity: 20,
        minimumStock: 2,
      },
    })
  ).id;
  serviceId = (
    await store.client.service.create({
      data: {
        businessId,
        slug: "sale-service-" + suffix,
        nameDe: "Service",
        nameEn: "Service",
        shortDescriptionDe: "x",
        shortDescriptionEn: "x",
        descriptionDe: "x",
        descriptionEn: "x",
        priceFrom: 2000,
        durationMinutes: 60,
      },
    })
  ).id;
  customerId = (
    await store.client.customer.create({
      data: {
        businessId,
        firstName: "Test",
        lastName: "Customer",
        email: suffix + "@example.test",
        phone: "000" + suffix,
      },
    })
  ).id;
  const vehicle = await store.client.vehicle.create({
    data: { businessId, customerId, type: "SEDAN" },
  });
  bookingId = (
    await store.client.booking.create({
      data: {
        businessId,
        bookingNumber: "BOOK-SALE-" + suffix,
        customerId,
        vehicleId: vehicle.id,
        serviceId,
        startsAt: new Date("2030-01-01T10:00:00Z"),
        endsAt: new Date("2030-01-01T11:00:00Z"),
      },
    })
  ).id;
  app = await buildApp({
    environment,
    authProvider: auth,
    dataStore: store,
    logger: false,
  });
});
afterAll(async () => {
  if (app) await app.close();
  await store.client.payment.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.inventoryMovement.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.saleItem.deleteMany({
    where: { sale: { businessId: { in: [businessId, otherBusinessId] } } },
  });
  await store.client.sale.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.booking.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.vehicle.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.customer.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.service.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.product.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.user.deleteMany({
    where: { businessId: { in: [businessId, otherBusinessId] } },
  });
  await store.client.business.deleteMany({
    where: { id: { in: [businessId, otherBusinessId] } },
  });
  await store.disconnect();
});
const create = (payload: Record<string, unknown>, user = adminClerk) =>
  app.inject({
    method: "POST",
    url: "/api/v1/sales",
    headers: headers(user),
    payload,
  });
describe("PostgreSQL sales and payments", () => {
  it("creates a multi-item draft using server prices and totals", async () => {
    const r = await create({
      customerId,
      items: [
        { type: "PRODUCT", productId, quantity: 2 },
        { type: "SERVICE", serviceId, quantity: 1 },
      ],
      discountMinor: 500,
      totalMinor: 1,
    });
    expect(r.statusCode).toBe(400);
    const ok = await create({
      customerId,
      items: [
        { type: "PRODUCT", productId, quantity: 2 },
        { type: "SERVICE", serviceId, quantity: 1 },
      ],
      discountMinor: 500,
    });
    expect(ok.statusCode).toBe(201);
    expect(ok.json<Record<string, unknown>>()).toMatchObject({
      status: "DRAFT",
      subtotalMinor: 4000,
      discountMinor: 500,
      taxMinor: 665,
      totalMinor: 4165,
      paidMinor: 0,
      paymentStatus: "UNPAID",
    });
    expect(ok.json<{ items: unknown[] }>().items).toHaveLength(2);
  });
  it("rejects unpriced products instead of creating zero-value sales", async () => {
    const unpriced = await store.client.product.create({
      data: {
        businessId,
        sku: "UNPRICED-" + suffix,
        name: "Unpriced",
        category: "OTHER",
        salePriceMinor: 0,
        stockQuantity: 1,
      },
    });
    const response = await create({
      items: [{ type: "PRODUCT", productId: unpriced.id, quantity: 1 }],
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "PRODUCT_PRICE_REQUIRED" },
    });
  });
  it("derives booking customer and rejects cross-business references", async () => {
    const r = await create({
      bookingId,
      items: [{ type: "SERVICE", serviceId, quantity: 1 }],
    });
    expect(r.statusCode).toBe(201);
    expect(r.json<Record<string, unknown>>()).toMatchObject({
      customerId,
      bookingId,
    });
    expect(
      (
        await create(
          { customerId, items: [{ type: "PRODUCT", productId, quantity: 1 }] },
          otherClerk,
        )
      ).statusCode,
    ).toBe(404);
  });
  it("allows employees to draft/complete but forbids service price override", async () => {
    expect(
      (
        await create(
          {
            items: [
              {
                type: "SERVICE",
                serviceId,
                quantity: 1,
                unitPriceOverrideMinor: 2500,
              },
            ],
          },
          employeeClerk,
        )
      ).statusCode,
    ).toBe(403);
    const d = await create(
      { items: [{ type: "PRODUCT", productId, quantity: 1 }] },
      employeeClerk,
    );
    expect(d.statusCode).toBe(201);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/sales/" + d.json<{ id: string }>().id + "/complete",
          headers: headers(employeeClerk),
        })
      ).statusCode,
    ).toBe(200);
  });
  it("completes once, decrements stock and records a SALE movement with snapshot price", async () => {
    const before = (
      await store.client.product.findUniqueOrThrow({ where: { id: productId } })
    ).stockQuantity;
    const d = await create({
      items: [{ type: "PRODUCT", productId, quantity: 3 }],
    });
    const id = d.json<{ id: string }>().id;
    const done = await app.inject({
      method: "POST",
      url: "/api/v1/sales/" + id + "/complete",
      headers: headers(),
    });
    expect(done.statusCode).toBe(200);
    expect(done.json<Record<string, unknown>>()).toMatchObject({
      status: "COMPLETED",
      subtotalMinor: 3000,
      totalMinor: 3570,
    });
    expect(
      (
        await store.client.product.findUniqueOrThrow({
          where: { id: productId },
        })
      ).stockQuantity,
    ).toBe(before - 3);
    expect(
      await store.client.inventoryMovement.findFirst({
        where: { referenceId: id, type: "SALE", quantityDelta: -3 },
      }),
    ).not.toBeNull();
    await store.client.product.update({
      where: { id: productId },
      data: { salePriceMinor: 9999 },
    });
    expect(
      (await store.client.saleItem.findFirstOrThrow({ where: { saleId: id } }))
        .unitPriceMinor,
    ).toBe(1000);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/sales/" + id + "/complete",
          headers: headers(),
        })
      ).statusCode,
    ).toBe(409);
    await store.client.product.update({
      where: { id: productId },
      data: { salePriceMinor: 1000 },
    });
  });
  it("rejects insufficient stock and competing completions never oversell", async () => {
    const p = await store.client.product.create({
      data: {
        businessId,
        sku: "RACE-" + suffix,
        name: "Race",
        salePriceMinor: 100,
        stockQuantity: 5,
        minimumStock: 0,
      },
    });
    const a = await create({
      items: [{ type: "PRODUCT", productId: p.id, quantity: 4 }],
    });
    const b = await create({
      items: [{ type: "PRODUCT", productId: p.id, quantity: 4 }],
    });
    const rs = await Promise.all(
      [a, b].map((d) =>
        app.inject({
          method: "POST",
          url: "/api/v1/sales/" + d.json<{ id: string }>().id + "/complete",
          headers: headers(),
        }),
      ),
    );
    expect(rs.map((x) => x.statusCode).sort()).toEqual([200, 409]);
    expect(
      (await store.client.product.findUniqueOrThrow({ where: { id: p.id } }))
        .stockQuantity,
    ).toBe(1);
  });
  it("completing a service-only sale never changes product inventory", async () => {
    const before = (
      await store.client.product.findUniqueOrThrow({ where: { id: productId } })
    ).stockQuantity;
    const draft = await create({
      items: [{ type: "SERVICE", serviceId, quantity: 1 }],
    });
    expect(draft.statusCode).toBe(201);
    const completed = await app.inject({
      method: "POST",
      url: "/api/v1/sales/" + draft.json<{ id: string }>().id + "/complete",
      headers: headers(),
    });
    expect(completed.statusCode).toBe(200);
    expect(
      (
        await store.client.product.findUniqueOrThrow({
          where: { id: productId },
        })
      ).stockQuantity,
    ).toBe(before);
  });
  it("uses current tax for drafts/completion and preserves completed snapshots", async () => {
    await store.client.business.update({
      where: { id: businessId },
      data: { taxRateBps: 1900 },
    });
    const historical = await create({
      items: [{ type: "PRODUCT", productId, quantity: 1 }],
    });
    const historicalId = historical.json<{ id: string }>().id;
    await app.inject({
      method: "POST",
      url: `/api/v1/sales/${historicalId}/complete`,
      headers: headers(),
    });
    await store.client.business.update({
      where: { id: businessId },
      data: { taxRateBps: 700 },
    });
    expect(
      (
        await app.inject({
          method: "GET",
          url: `/api/v1/sales/${historicalId}`,
          headers: headers(),
        })
      ).json(),
    ).toMatchObject({ taxMinor: 190, totalMinor: 1190 });
    const draft = await create({
      items: [{ type: "PRODUCT", productId, quantity: 1 }],
    });
    expect(draft.json()).toMatchObject({ taxMinor: 70, totalMinor: 1070 });
    await store.client.business.update({
      where: { id: businessId },
      data: { taxRateBps: 0 },
    });
    const completed = await app.inject({
      method: "POST",
      url: `/api/v1/sales/${draft.json<{ id: string }>().id}/complete`,
      headers: headers(),
    });
    expect(completed.json()).toMatchObject({ taxMinor: 0, totalMinor: 1000 });
    expect(
      (
        await app.inject({
          method: "GET",
          url: `/api/v1/sales/${historicalId}`,
          headers: headers(),
        })
      ).json(),
    ).toMatchObject({ taxMinor: 190, totalMinor: 1190 });
    await store.client.business.update({
      where: { id: businessId },
      data: { taxRateBps: 1900 },
    });
  });
  it("records partial/full manual payments and rejects overpayment", async () => {
    const d = await create({
      items: [{ type: "PRODUCT", productId, quantity: 1 }],
    });
    const id = d.json<{ id: string }>().id;
    await app.inject({
      method: "POST",
      url: "/api/v1/sales/" + id + "/complete",
      headers: headers(),
    });
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/sales/" + id + "/payments",
          headers: headers(),
          payload: { method: "CASH", amountMinor: 500 },
        })
      ).statusCode,
    ).toBe(201);
    let detail = await app.inject({
      method: "GET",
      url: "/api/v1/sales/" + id,
      headers: headers(),
    });
    expect(detail.json<Record<string, unknown>>()).toMatchObject({
      paidMinor: 500,
      remainingMinor: 690,
      paymentStatus: "PARTIALLY_PAID",
    });
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/sales/" + id + "/payments",
          headers: headers(),
          payload: { method: "CARD", amountMinor: 691 },
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/sales/" + id + "/payments",
          headers: headers(),
          payload: { method: "CARD", amountMinor: 690 },
        })
      ).statusCode,
    ).toBe(201);
    detail = await app.inject({
      method: "GET",
      url: "/api/v1/sales/" + id,
      headers: headers(),
    });
    expect(detail.json()).toMatchObject({
      paidMinor: 1190,
      remainingMinor: 0,
      paymentStatus: "PAID",
    });
  });
  it("cancels an unpaid completed sale once and restores inventory", async () => {
    const before = (
      await store.client.product.findUniqueOrThrow({ where: { id: productId } })
    ).stockQuantity;
    const d = await create({
      items: [{ type: "PRODUCT", productId, quantity: 2 }],
    });
    const id = d.json<{ id: string }>().id;
    await app.inject({
      method: "POST",
      url: "/api/v1/sales/" + id + "/complete",
      headers: headers(),
    });
    const cancelled = await app.inject({
      method: "POST",
      url: "/api/v1/sales/" + id + "/cancel",
      headers: headers(),
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json<{ status: string }>().status).toBe("CANCELLED");
    expect(
      (
        await store.client.product.findUniqueOrThrow({
          where: { id: productId },
        })
      ).stockQuantity,
    ).toBe(before);
    expect(
      await store.client.inventoryMovement.count({
        where: { referenceId: id, type: "CANCELLATION" },
      }),
    ).toBe(1);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/sales/" + id + "/cancel",
          headers: headers(),
        })
      ).statusCode,
    ).toBe(409);
  });
  it("blocks cancellation of paid sales and enforces payment business scope", async () => {
    const d = await create({
      items: [{ type: "SERVICE", serviceId, quantity: 1 }],
    });
    const id = d.json<{ id: string }>().id;
    await app.inject({
      method: "POST",
      url: "/api/v1/sales/" + id + "/complete",
      headers: headers(),
    });
    await app.inject({
      method: "POST",
      url: "/api/v1/sales/" + id + "/payments",
      headers: headers(),
      payload: { method: "BANK_TRANSFER", amountMinor: 100 },
    });
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/sales/" + id + "/cancel",
          headers: headers(),
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/sales/" + id + "/payments",
          headers: headers(otherClerk),
        })
      ).statusCode,
    ).toBe(404);
  });
});
