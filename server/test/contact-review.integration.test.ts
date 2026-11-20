import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../src/build-app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import { PrismaDataStore } from "../src/database/prisma.js";
import type { AuthProvider } from "../src/shared/auth/auth-provider.js";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is required; contact/review integration tests must not be skipped.");

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

const store = new PrismaDataStore(url);
const suffix = randomUUID().slice(0, 8);
const businessId = `contact-review-business-${suffix}`;
const otherBusinessId = `contact-review-other-${suffix}`;
const adminClerk = `contact-review-admin-${suffix}`;
const otherAdminClerk = `contact-review-other-admin-${suffix}`;
const managerClerk = `contact-review-manager-${suffix}`;
const employeeClerk = `contact-review-employee-${suffix}`;
const inactiveAdminClerk = `contact-review-inactive-${suffix}`;

const auth: AuthProvider = {
  getIdentity(request) {
    const userId = request.headers["x-test-user-id"];
    return typeof userId === "string"
      ? { userId, sessionId: "test", organizationId: null }
      : null;
  },
};

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  // Keep this fixture's business first so the public "first business" lookup
  // targets it deterministically in the shared disposable test database.
  await store.client.business.create({
    data: {
      id: businessId,
      name: "Contact and Review Integration",
      slug: `contact-review-${suffix}`,
      createdAt: new Date("2000-01-01T00:00:00.000Z"),
    },
  });
  await store.client.business.create({
    data: {
      id: otherBusinessId,
      name: "Contact and Review Other",
      slug: `contact-review-other-${suffix}`,
      createdAt: new Date("2000-01-02T00:00:00.000Z"),
    },
  });
  await store.client.user.create({
    data: { businessId, clerkUserId: adminClerk, role: "ADMIN" },
  });
  await store.client.user.create({
    data: { businessId: otherBusinessId, clerkUserId: otherAdminClerk, role: "ADMIN" },
  });
  await store.client.user.createMany({ data: [
    { businessId, clerkUserId: managerClerk, role: "MANAGER" },
    { businessId, clerkUserId: employeeClerk, role: "EMPLOYEE" },
    { businessId, clerkUserId: inactiveAdminClerk, role: "ADMIN", isActive: false },
  ] });

  app = await buildApp({
    environment,
    authProvider: auth,
    dataStore: store,
    logger: false,
  });
});

afterAll(async () => {
  if (app) await app.close();
  await store.client.review.deleteMany({ where: { businessId: { in: [businessId, otherBusinessId] } } });
  await store.client.contactMessage.deleteMany({ where: { businessId: { in: [businessId, otherBusinessId] } } });
  await store.client.user.deleteMany({ where: { businessId: { in: [businessId, otherBusinessId] } } });
  await store.client.business.deleteMany({ where: { id: { in: [businessId, otherBusinessId] } } });
  await store.disconnect();
});

describe("contact and review persistence with PostgreSQL", () => {
  it("enforces contact inbox roles, tenant boundaries, pagination and private detail", async () => {
    const payload = { name: "Contact fixture", email: "fixture@example.test", phone: "5550101",
      subject: "Inbox fixture", message: "Text shown only on detail.", createdAt: new Date("2100-01-01T00:00:00Z") };
    const one = await store.client.contactMessage.create({ data: { ...payload, businessId } });
    const two = await store.client.contactMessage.create({ data: { ...payload, businessId } });
    const foreign = await store.client.contactMessage.create({ data: { ...payload, businessId: otherBusinessId } });
    const root = "/api/v1/contact-messages";
    const get = (url: string, user?: string) => app.inject({ url, headers: user ? { "x-test-user-id": user } : {} });
    for (const url of [root, root + "/" + one.id]) {
      const anonymous = await get(url);
      expect(anonymous.statusCode).toBe(401);
      expect(anonymous.headers["cache-control"]).toBe("no-store");
      for (const user of [managerClerk, employeeClerk, inactiveAdminClerk, "unprovisioned"]) {
        const denied = await get(url, user);
        expect(denied.statusCode).toBe(403);
        expect(denied.headers["cache-control"]).toBe("no-store");
      }
    }
    const [older, newer] = [one.id, two.id].sort();
    const first = await get(root + "?limit=1", adminClerk);
    expect(first.statusCode).toBe(200);
    expect(first.headers["cache-control"]).toBe("no-store");
    expect(first.json()).toEqual({
      items: [{ id: newer, subject: payload.subject, createdAt: payload.createdAt.toISOString() }],
      nextCursor: newer,
    });
    const next = await get(root + "?limit=1&after=" + newer, adminClerk);
    expect(next.json()).toMatchObject({ items: [{ id: older }] });
    const detail = await get(root + "/" + one.id, adminClerk);
    expect(detail.statusCode).toBe(200);
    expect(detail.headers["cache-control"]).toBe("no-store");
    expect(detail.json()).toMatchObject({ id: one.id, name: payload.name, email: payload.email, phone: payload.phone, message: payload.message });
    for (const url of [root + "/" + foreign.id, root + "?after=" + foreign.id]) {
      expect((await get(url, adminClerk)).statusCode).toBe(404);
    }
    expect((await get(root + "?limit=51", adminClerk)).statusCode).toBe(400);
    expect((await get(root + "?businessId=" + otherBusinessId, adminClerk)).statusCode).toBe(400);
    expect((await get("/api/v1/public/contact-messages/" + one.id)).statusCode).toBe(404);
    expect((await get(root)).body).not.toContain(payload.email);
  });

  it("retains the bounded PostgreSQL string columns from the applied migrations", async () => {
    const columns = await store.client.$queryRaw<Array<{
      table: string;
      name: string;
      type: string;
      max: number;
    }>>`
      SELECT table_name AS "table", column_name AS name, data_type AS type,
             character_maximum_length::int AS max
      FROM information_schema.columns
      WHERE table_schema = 'public' AND (table_name, column_name) IN (
        ('BusinessOpeningHour', 'openTime'), ('BusinessOpeningHour', 'closeTime'),
        ('ContactMessage', 'name'), ('ContactMessage', 'email'), ('ContactMessage', 'phone'),
        ('ContactMessage', 'subject'), ('ContactMessage', 'message'),
        ('Review', 'customerName'), ('Review', 'email'), ('Review', 'message')
      )
      ORDER BY table_name, column_name
    `;
    expect(columns).toEqual([
      { table: "BusinessOpeningHour", name: "closeTime", max: 5 },
      { table: "BusinessOpeningHour", name: "openTime", max: 5 },
      { table: "ContactMessage", name: "email", max: 254 },
      { table: "ContactMessage", name: "message", max: 4000 },
      { table: "ContactMessage", name: "name", max: 120 },
      { table: "ContactMessage", name: "phone", max: 40 },
      { table: "ContactMessage", name: "subject", max: 160 },
      { table: "Review", name: "customerName", max: 80 },
      { table: "Review", name: "email", max: 254 },
      { table: "Review", name: "message", max: 2000 },
    ].map(column => ({ ...column, type: "character varying" })));
  });

  it("persists a real contact message with normalized values", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/contact-messages",
      payload: {
        name: "Ada Lovelace",
        email: " ADA@example.test ",
        phone: " +49 30 123456 ",
        subject: "Appointment question",
        message: "I would like to ask about an appointment next week.",
      },
    });

    expect(response.statusCode).toBe(201);
    const row = await store.client.contactMessage.findFirst({
      where: { businessId, email: "ada@example.test" },
    });
    expect(row).toMatchObject({
      businessId,
      name: "Ada Lovelace",
      email: "ada@example.test",
      phone: "+49 30 123456",
      subject: "Appointment question",
    });
  });

  it("moderates real reviews and only exposes approved reviews publicly", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/public/reviews",
      payload: {
        customerName: "Ada Reviewer",
        rating: 5,
        message: "A very clear and helpful booking experience.",
        email: "ada.reviewer@example.test",
      },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: "/api/v1/public/reviews",
      payload: {
        customerName: "Rejected Reviewer",
        rating: 2,
        message: "This review should not be published publicly.",
      },
    });
    expect(second.statusCode).toBe(201);

    const pendingRows = await store.client.review.findMany({ where: { businessId } });
    expect(pendingRows).toHaveLength(2);
    expect(pendingRows.every((row) => row.status === "PENDING")).toBe(true);

    const publicBefore = await app.inject({ method: "GET", url: "/api/v1/public/reviews" });
    expect(publicBefore.json<Array<Record<string, unknown>>>()).toHaveLength(0);

    const firstId = pendingRows.find((row) => row.customerName === "Ada Reviewer")!.id;
    const secondId = pendingRows.find((row) => row.customerName === "Rejected Reviewer")!.id;

    expect(
      (
        await app.inject({
          method: "PATCH",
          url: `/api/v1/reviews/${firstId}/status`,
          headers: { "x-test-user-id": adminClerk },
          payload: { status: "APPROVED" },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: `/api/v1/reviews/${secondId}/status`,
          headers: { "x-test-user-id": adminClerk },
          payload: { status: "REJECTED" },
        })
      ).statusCode,
    ).toBe(200);

    const publicAfter = await app.inject({ method: "GET", url: "/api/v1/public/reviews" });
    const visible = publicAfter.json<Array<Record<string, unknown>>>();
    expect(visible).toHaveLength(1);
    expect(visible[0]).toMatchObject({ customerName: "Ada Reviewer", rating: 5 });
    expect(visible[0]).not.toHaveProperty("email");
    expect(visible[0]).not.toHaveProperty("status");

    const adminList = await app.inject({
      method: "GET",
      url: "/api/v1/reviews?status=APPROVED",
      headers: { "x-test-user-id": adminClerk },
    });
    expect(adminList.statusCode).toBe(200);
    expect(adminList.json<{ items: Array<{ id: string; email: string | null }> }>().items).toEqual([
      expect.objectContaining({ id: firstId, email: "ada.reviewer@example.test" }),
    ]);
  });

  it("keeps moderation and listing within the administrator business", async () => {
    const otherReview = await store.client.review.create({
      data: {
        businessId: otherBusinessId,
        customerName: "Other tenant",
        rating: 4,
        message: "This review belongs to a different business.",
      },
    });

    const otherList = await app.inject({
      method: "GET",
      url: "/api/v1/reviews",
      headers: { "x-test-user-id": adminClerk },
    });
    expect(otherList.json<{ items: Array<{ id: string }> }>().items.map((row) => row.id)).not.toContain(otherReview.id);

    const forbidden = await app.inject({
      method: "PATCH",
      url: `/api/v1/reviews/${otherReview.id}/status`,
      headers: { "x-test-user-id": adminClerk },
      payload: { status: "APPROVED" },
    });
    expect(forbidden.statusCode).toBe(404);
    expect((await store.client.review.findUnique({ where: { id: otherReview.id } }))?.status).toBe("PENDING");
  });
});
