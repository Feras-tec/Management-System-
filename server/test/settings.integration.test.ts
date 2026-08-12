import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import { PrismaDataStore } from "../src/database/prisma.js";
import type { AuthProvider } from "../src/shared/auth/auth-provider.js";

const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "TEST_DATABASE_URL is required; settings integration tests must not be skipped.",
  );
const store = new PrismaDataStore(url);
const suffix = Date.now().toString(36);
const businessId = `settings-${suffix}`;
const otherId = `settings-other-${suffix}`;
const users = {
  admin: `settings-admin-${suffix}`,
  manager: `settings-manager-${suffix}`,
  employee: `settings-employee-${suffix}`,
  other: `settings-other-user-${suffix}`,
};
const environment: ServerEnvironment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3991,
  LOG_LEVEL: "silent",
  FRONTEND_ORIGIN: "http://localhost:5173",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  CLERK_SECRET_KEY: "sk_test_placeholder",
  DATABASE_URL: url,
};
const auth: AuthProvider = {
  getIdentity(request) {
    const userId = request.headers["x-test-user-id"];
    return typeof userId === "string"
      ? { userId, sessionId: "test", organizationId: null }
      : null;
  },
};
const headers = (userId: string) => ({ "x-test-user-id": userId });
let app: Awaited<ReturnType<typeof buildApp>>;
beforeAll(async () => {
  await store.client.business.createMany({
    data: [
      { id: businessId, name: "Settings Test", slug: `settings-${suffix}` },
      { id: otherId, name: "Other Settings", slug: `settings-other-${suffix}` },
    ],
  });
  await store.client.user.createMany({
    data: [
      { businessId, clerkUserId: users.admin, role: "ADMIN" },
      { businessId, clerkUserId: users.manager, role: "MANAGER" },
      { businessId, clerkUserId: users.employee, role: "EMPLOYEE" },
      { businessId: otherId, clerkUserId: users.other, role: "ADMIN" },
    ],
  });
  app = await buildApp({
    environment,
    authProvider: auth,
    dataStore: store,
    logger: false,
  });
});
afterAll(async () => {
  if (app) await app.close();
  await store.client.user.deleteMany({
    where: { businessId: { in: [businessId, otherId] } },
  });
  await store.client.business.deleteMany({
    where: { id: { in: [businessId, otherId] } },
  });
  await store.disconnect();
});
function payload(taxRateBps = 700) {
  return {
    name: "Updated Business",
    locale: "en",
    timezone: "Europe/Berlin",
    taxRateBps,
    openingHours: [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ].map((dayOfWeek, index) => ({
      dayOfWeek,
      isOpen: index < 6,
      openTime: index < 6 ? "09:00" : null,
      closeTime: index < 6 ? "17:00" : null,
    })),
  };
}
describe("business settings", () => {
  it("creates and returns seven default days", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/settings",
      headers: headers(users.admin),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      currency: "EUR",
      locale: "de",
      timezone: "Europe/Berlin",
      taxRateBps: 1900,
      canEdit: true,
    });
    expect(
      response.json<{ openingHours: unknown[] }>().openingHours,
    ).toHaveLength(7);
  });
  it("allows managers to read but only admins to update", async () => {
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/settings",
          headers: headers(users.manager),
        })
      ).json(),
    ).toMatchObject({ canEdit: false });
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: "/api/v1/settings",
          headers: headers(users.manager),
          payload: payload(),
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/settings",
          headers: headers(users.employee),
        })
      ).statusCode,
    ).toBe(403);
  });
  it("persists admin updates without accepting currency", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/settings",
      headers: headers(users.admin),
      payload: { ...payload(), currency: "USD" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: "Updated Business",
      currency: "EUR",
      locale: "en",
      taxRateBps: 700,
    });
    expect(
      (
        await store.client.business.findUniqueOrThrow({
          where: { id: businessId },
        })
      ).currency,
    ).toBe("EUR");
  });
  it("rejects invalid tax, duplicate weekdays, and invalid times", async () => {
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: "/api/v1/settings",
          headers: headers(users.admin),
          payload: payload(10001),
        })
      ).statusCode,
    ).toBe(400);
    const duplicate = payload();
    duplicate.openingHours[6]!.dayOfWeek = "MONDAY";
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: "/api/v1/settings",
          headers: headers(users.admin),
          payload: duplicate,
        })
      ).statusCode,
    ).toBe(400);
    const badTime = payload();
    badTime.openingHours[0]!.openTime = "18:00";
    badTime.openingHours[0]!.closeTime = "08:00";
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: "/api/v1/settings",
          headers: headers(users.admin),
          payload: badTime,
        })
      ).statusCode,
    ).toBe(400);
  });
  it("isolates settings by authenticated business", async () => {
    const other = await app.inject({
      method: "GET",
      url: "/api/v1/settings",
      headers: headers(users.other),
    });
    expect(other.statusCode).toBe(200);
    expect(other.json()).toMatchObject({
      name: "Other Settings",
      taxRateBps: 1900,
    });
  });
});
