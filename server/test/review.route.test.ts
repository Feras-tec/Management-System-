import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/build-app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import type { AuthProvider } from "../src/shared/auth/auth-provider.js";
import type {
  AdminReviewListOptions,
  ReviewStore,
} from "../src/modules/reviews/review.types.js";
import { FakeDataStore } from "./helpers/fake-data-store.js";

const environment: ServerEnvironment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3001,
  LOG_LEVEL: "silent",
  FRONTEND_ORIGIN: "http://localhost:5173",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  CLERK_SECRET_KEY: "sk_test_placeholder",
  DATABASE_URL: "postgresql://USER:PASSWORD@HOST:PORT/DATABASE",
};

type Row = {
  id: string;
  businessId: string;
  customerName: string;
  rating: number;
  message: string;
  email?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
};

class Store implements ReviewStore {
  rows: Row[] = [];

  findPublicBusinessId() {
    return Promise.resolve("business-1");
  }

  create(businessId: string, input: { customerName: string; rating: number; message: string; email?: string }) {
    const now = new Date();
    const row: Row = { id: "r" + (this.rows.length + 1), businessId, ...input, status: "PENDING", createdAt: now, updatedAt: now };
    this.rows.push(row);
    return Promise.resolve({ id: row.id, status: row.status });
  }

  listApproved(businessId: string) {
    return Promise.resolve(
      this.rows
        .filter((row) => row.businessId === businessId && row.status === "APPROVED")
        .map((row) => ({
          id: row.id,
          customerName: row.customerName,
          rating: row.rating,
          message: row.message,
          createdAt: row.createdAt,
        })),
    );
  }

  listForAdmin(businessId: string, options: AdminReviewListOptions) {
    const rows = this.rows.filter(
      (row) => row.businessId === businessId && (!options.status || row.status === options.status),
    );
    const start = (options.page - 1) * options.limit;
    return Promise.resolve({
      items: rows.slice(start, start + options.limit).map((row) => ({
        id: row.id,
        customerName: row.customerName,
        rating: row.rating,
        message: row.message,
        email: row.email ?? null,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      total: rows.length,
      page: options.page,
      limit: options.limit,
    });
  }

  updateStatus(businessId: string, id: string, status: "APPROVED" | "REJECTED") {
    const row = this.rows.find((entry) => entry.id === id && entry.businessId === businessId);
    if (!row) return Promise.resolve(null);
    row.status = status;
    row.updatedAt = new Date();
    return Promise.resolve({ id, status });
  }
}

const auth: AuthProvider = {
  getIdentity(request) {
    const header = request.headers["x-test-user-id"];
    if (typeof header !== "string") return null;
    const userId = header === "admin" ? "test-user" : header;
    return { userId, sessionId: "s", organizationId: null };
  },
};

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function setup() {
  const store = new Store();
  const data = new FakeDataStore();
  data.users.push(
    {
      id: "user-employee",
      clerkUserId: "employee",
      businessId: "business-1",
      role: "EMPLOYEE",
      isActive: true,
      business: data.users[0]!.business,
    },
    {
      id: "user-other-admin",
      clerkUserId: "other-admin",
      businessId: "business-2",
      role: "ADMIN",
      isActive: true,
      business: { ...data.users[0]!.business, id: "business-2", name: "Other business" },
    },
  );
  const app = await buildApp({
    environment,
    authProvider: auth,
    dataStore: data,
    reviewStore: store,
    logger: false,
  });
  apps.push(app);
  return { app, store };
}

async function setupWithoutInjectedAuth() {
  const store = new Store();
  const app = await buildApp({
    environment,
    dataStore: new FakeDataStore(),
    reviewStore: store,
    logger: false,
  });
  apps.push(app);
  return { app, store };
}

const body = {
  customerName: "Ada L.",
  rating: 5,
  message: "A very clear and helpful booking experience.",
  email: "ada@example.test",
};

describe("review API", () => {
  it("keeps submissions pending and public reads approved-only without email", async () => {
    const { app, store } = await setup();

    expect((await app.inject({ method: "POST", url: "/api/v1/public/reviews", payload: body })).statusCode).toBe(201);
    expect((await app.inject({ method: "GET", url: "/api/v1/public/reviews" })).json()).toEqual([]);

    const approve = await app.inject({
      method: "PATCH",
      url: "/api/v1/reviews/r1/status",
      headers: { "x-test-user-id": "admin" },
      payload: { status: "APPROVED" },
    });
    expect(approve.statusCode).toBe(200);

    const publicRows = await app.inject({ method: "GET", url: "/api/v1/public/reviews" });
    const rows = publicRows.json<Array<Record<string, unknown>>>();
    expect(rows).toEqual([expect.objectContaining({ customerName: "Ada L.", rating: 5 })]);
    expect(rows[0]).not.toHaveProperty("email");
    expect(rows[0]).not.toHaveProperty("status");
    expect(store.rows[0]?.status).toBe("APPROVED");
  });

  it("rejects invalid, honeypot, and unauthorized moderation", async () => {
    const { app } = await setup();

    expect((await app.inject({ method: "POST", url: "/api/v1/public/reviews", payload: { ...body, rating: 6 } })).statusCode).toBe(400);
    expect((await app.inject({ method: "POST", url: "/api/v1/public/reviews", payload: { ...body, website: "spam" } })).statusCode).toBe(400);
    expect((await app.inject({ method: "PATCH", url: "/api/v1/reviews/unknown/status", payload: { status: "APPROVED" } })).statusCode).toBe(401);
  });

  it("lists every moderation status for administrators only", async () => {
    const { app, store } = await setup();
    store.rows.push(
      { id: "p1", businessId: "business-1", customerName: "Pending", rating: 4, message: "Pending review body.", status: "PENDING", createdAt: new Date(), updatedAt: new Date() },
      { id: "a1", businessId: "business-1", customerName: "Approved", rating: 5, message: "Approved review body.", status: "APPROVED", createdAt: new Date(), updatedAt: new Date() },
      { id: "x1", businessId: "business-1", customerName: "Rejected", rating: 2, message: "Rejected review body.", status: "REJECTED", createdAt: new Date(), updatedAt: new Date() },
      { id: "o1", businessId: "business-2", customerName: "Tenant two", rating: 5, message: "Other business review.", status: "PENDING", createdAt: new Date(), updatedAt: new Date() },
    );

    const all = await app.inject({ method: "GET", url: "/api/v1/reviews", headers: { "x-test-user-id": "admin" } });
    expect(all.statusCode).toBe(200);
    const allRows = all.json<{ items: Array<Record<string, unknown>>; total: number }>();
    expect(allRows.total).toBe(3);
    expect(allRows.items.map((row) => row.id).sort()).toEqual(["a1", "p1", "x1"]);
    expect(allRows.items.find((row) => row.id === "p1")).toHaveProperty("email");

    const pending = await app.inject({ method: "GET", url: "/api/v1/reviews?status=PENDING", headers: { "x-test-user-id": "admin" } });
    expect(pending.json<{ items: Array<{ id: string }> }>().items.map((row) => row.id)).toEqual(["p1"]);

    const employee = await app.inject({ method: "GET", url: "/api/v1/reviews", headers: { "x-test-user-id": "employee" } });
    expect(employee.statusCode).toBe(403);

    const anonymous = await app.inject({ method: "GET", url: "/api/v1/reviews" });
    expect(anonymous.statusCode).toBe(401);
  });

  it("enforces tenant isolation when moderating reviews", async () => {
    const { app, store } = await setup();
    store.rows.push({ id: "p1", businessId: "business-1", customerName: "Pending", rating: 4, message: "Pending review body.", status: "PENDING", createdAt: new Date(), updatedAt: new Date() });

    const other = await app.inject({
      method: "PATCH",
      url: "/api/v1/reviews/p1/status",
      headers: { "x-test-user-id": "other-admin" },
      payload: { status: "APPROVED" },
    });
    expect(other.statusCode).toBe(404);
    expect(store.rows[0]?.status).toBe("PENDING");
  });

  it("keeps rejected reviews out of the public list", async () => {
    const { app, store } = await setup();
    store.rows.push(
      { id: "a1", businessId: "business-1", customerName: "Approved", rating: 5, message: "Approved review body.", status: "APPROVED", createdAt: new Date(), updatedAt: new Date() },
      { id: "x1", businessId: "business-1", customerName: "Rejected", rating: 2, message: "Rejected review body.", status: "REJECTED", createdAt: new Date(), updatedAt: new Date() },
    );

    const rows = (await app.inject({ method: "GET", url: "/api/v1/public/reviews" })).json<Array<{ id: string }>>();
    expect(rows.map((row) => row.id)).toEqual(["a1"]);
  });
});

describe("review route registration", () => {
  it("boots with Clerk route registration and keeps public reviews available once", async () => {
    const { app } = await setupWithoutInjectedAuth();
    const response = await app.inject({ method: "GET", url: "/api/v1/public/reviews" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });
});
