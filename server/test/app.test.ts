import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/build-app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import type { AuthProvider } from "../src/shared/auth/auth-provider.js";
import type { ErrorResponse } from "../src/shared/errors/error-response.js";
import { FakeDataStore } from "./helpers/fake-data-store.js";

const testEnvironment: ServerEnvironment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3001,
  LOG_LEVEL: "silent",
  FRONTEND_ORIGIN: "http://localhost:5173",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  DATABASE_URL: "postgresql://USER:PASSWORD@HOST:PORT/DATABASE",
  CLERK_SECRET_KEY: "sk_test_placeholder",
};

const testAuthProvider: AuthProvider = {
  getIdentity(request) {
    if (request.headers["x-test-user-id"] !== "test-user") {
      return null;
    }

    return {
      userId: "test-user",
      sessionId: "test-session",
      organizationId: null,
    };
  },
};

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

async function createTestApp(dataStore = new FakeDataStore()) {
  const app = await buildApp({
    environment: testEnvironment,
    authProvider: testAuthProvider,
    dataStore,
    logger: false,
  });

  apps.push(app);
  return { app, dataStore };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("backend API", () => {
  it("returns a minimal public health response", async () => {
    const { app } = await createTestApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("returns the error contract for an unknown API route", async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/nonexistent",
    });

    expect(response.statusCode).toBe(404);
    const body = response.json<ErrorResponse>();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Route not found.");
    expect(typeof body.error.requestId).toBe("string");
  });

  it("rejects /api/v1/me without verified authentication", async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/me",
    });

    expect(response.statusCode).toBe(401);
    const body = response.json<ErrorResponse>();
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBe("Authentication is required.");
    expect(typeof body.error.requestId).toBe("string");
  });

  it("returns a limited identity for a verified request", async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: {
        "x-test-user-id": "test-user",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: {
        id: "user-1",
        clerkUserId: "test-user",
        role: "ADMIN",
        isActive: true,
      },
      business: {
        id: "business-1",
        name: "AutoCare",
        currency: "EUR",
        locale: "de",
        timezone: "Europe/Berlin",
      },
    });
  });

  it("allows only the configured frontend origin and Authorization header", async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/me",
      headers: {
        origin: testEnvironment.FRONTEND_ORIGIN,
        "access-control-request-method": "GET",
        "access-control-request-headers": "authorization",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      testEnvironment.FRONTEND_ORIGIN,
    );
    expect(response.headers["access-control-allow-headers"]).toContain(
      "Authorization",
    );
  });
});
