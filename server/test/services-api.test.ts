import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import type { AuthProvider } from "../src/shared/auth/auth-provider.js";
import type { ErrorResponse } from "../src/shared/errors/error-response.js";
import { FakeDataStore, validServiceInput } from "./helpers/fake-data-store.js";

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

const authProvider: AuthProvider = {
  getIdentity(request) {
    return request.headers["x-test-user-id"] === "test-user"
      ? { userId: "test-user", sessionId: "session", organizationId: null }
      : null;
  },
};

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
async function setup(store = new FakeDataStore()) {
  const app = await buildApp({ environment, authProvider, dataStore: store, logger: false });
  apps.push(app);
  return { app, store };
}
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

describe("application users", () => {
  it("rejects unknown and inactive application users", async () => {
    const unknownStore = new FakeDataStore();
    unknownStore.users = [];
    const { app: unknownApp } = await setup(unknownStore);
    const unknown = await unknownApp.inject({ method: "GET", url: "/api/v1/me", headers: { "x-test-user-id": "test-user" } });
    expect(unknown.statusCode).toBe(403);
    expect(unknown.json<ErrorResponse>().error.code).toBe("APPLICATION_USER_REQUIRED");

    const inactiveStore = new FakeDataStore();
    inactiveStore.users[0]!.isActive = false;
    const { app: inactiveApp } = await setup(inactiveStore);
    const inactive = await inactiveApp.inject({ method: "GET", url: "/api/v1/me", headers: { "x-test-user-id": "test-user" } });
    expect(inactive.statusCode).toBe(403);
    expect(inactive.json<ErrorResponse>().error.code).toBe("USER_INACTIVE");
  });
});

describe("services API", () => {
  it("creates, lists publicly, updates, and deactivates a service", async () => {
    const { app } = await setup();
    const headers = { "x-test-user-id": "test-user" };
    const created = await app.inject({ method: "POST", url: "/api/v1/services", headers, payload: validServiceInput });
    expect(created.statusCode).toBe(201);
    const id = created.json<{ id: string }>().id;
    expect((await app.inject({ method: "GET", url: "/api/v1/public/services" })).json()).toHaveLength(1);

    const updated = await app.inject({ method: "PATCH", url: `/api/v1/services/${id}`, headers, payload: { sortOrder: 5 } });
    expect(updated.json<{ sortOrder: number }>().sortOrder).toBe(5);
    const deactivated = await app.inject({ method: "DELETE", url: `/api/v1/services/${id}`, headers });
    expect(deactivated.json<{ isActive: boolean }>().isActive).toBe(false);
    expect((await app.inject({ method: "GET", url: "/api/v1/public/services" })).json()).toEqual([]);
  });

  it("maps duplicate business slugs to 409", async () => {
    const { app } = await setup();
    const request = { method: "POST" as const, url: "/api/v1/services", headers: { "x-test-user-id": "test-user" }, payload: validServiceInput };
    expect((await app.inject(request)).statusCode).toBe(201);
    const duplicate = await app.inject(request);
    expect(duplicate.statusCode).toBe(409);
  });

  it("keeps employees read-only", async () => {
    const store = new FakeDataStore();
    store.users[0]!.role = "EMPLOYEE";
    const { app } = await setup(store);
    const response = await app.inject({ method: "POST", url: "/api/v1/services", headers: { "x-test-user-id": "test-user" }, payload: validServiceInput });
    expect(response.statusCode).toBe(403);
  });

  it("enforces business scoping without accepting businessId", async () => {
    const store = new FakeDataStore();
    store.services.push({ ...validServiceInput, id: "foreign", businessId: "business-2", createdAt: new Date(), updatedAt: new Date() });
    const { app } = await setup(store);
    const response = await app.inject({ method: "GET", url: "/api/v1/services/foreign", headers: { "x-test-user-id": "test-user" } });
    expect(response.statusCode).toBe(404);
  });
});
