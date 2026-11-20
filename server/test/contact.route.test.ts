import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/build-app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import type { ContactStore } from "../src/modules/contact/contact.types.js";
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

class FakeContactStore implements ContactStore {
  messages: Array<{ businessId: string; name: string; email: string; phone?: string; subject: string; message: string }> = [];

  findPublicBusinessId() {
    return Promise.resolve("business-1");
  }

  createMessage(
    businessId: string,
    input: { name: string; email: string; phone?: string; subject: string; message: string },
  ) {
    this.messages.push({ businessId, ...input });
    return Promise.resolve({ id: "message-" + this.messages.length, createdAt: new Date() });
  }
}

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

async function setup(store = new FakeContactStore()) {
  const app = await buildApp({
    environment,
    dataStore: new FakeDataStore(),
    contactStore: store,
    logger: false,
  });
  apps.push(app);
  return { app, store };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

const validMessage = {
  name: "Ada Lovelace",
  email: " ADA@example.test ",
  phone: " +49 30 123456 ",
  subject: "Appointment question",
  message: "I would like to ask about an appointment next week.",
};

describe("public contact messages", () => {
  it("validates, normalizes, and stores a public contact message without exposing it", async () => {
    const { app, store } = await setup();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/contact-messages",
      payload: validMessage,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ accepted: true });
    expect(store.messages).toEqual([
      {
        businessId: "business-1",
        name: "Ada Lovelace",
        email: "ada@example.test",
        phone: "+49 30 123456",
        subject: "Appointment question",
        message: "I would like to ask about an appointment next week.",
      },
    ]);

    const readAttempt = await app.inject({
      method: "GET",
      url: "/api/v1/public/contact-messages",
    });
    expect(readAttempt.statusCode).toBe(404);
  });

  it("rejects invalid payloads and honeypot submissions without storing them", async () => {
    const { app, store } = await setup();

    const invalid = await app.inject({
      method: "POST",
      url: "/api/v1/public/contact-messages",
      payload: { ...validMessage, email: "not-an-email" },
    });
    expect(invalid.statusCode).toBe(400);

    const spam = await app.inject({
      method: "POST",
      url: "/api/v1/public/contact-messages",
      payload: { ...validMessage, website: "https://spam.example" },
    });
    expect(spam.statusCode).toBe(400);
    expect(store.messages).toEqual([]);
  });

  it("limits repeated submissions from the same requester", async () => {
    const { app } = await setup();
    for (let index = 0; index < 5; index += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/public/contact-messages",
        payload: { ...validMessage, email: "ada-" + index + "@example.test" },
      });
      expect(response.statusCode).toBe(201);
    }

    const limited = await app.inject({
      method: "POST",
      url: "/api/v1/public/contact-messages",
      payload: { ...validMessage, email: "over-limit@example.test" },
    });
    expect(limited.statusCode).toBe(429);
    expect(limited.json<{ error: { code: string } }>().error.code).toBe("RATE_LIMITED");
  });

  it("returns 413 for a request larger than the configured limit without storing it", async () => {
    const { app, store } = await setup();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/contact-messages",
      payload: { ...validMessage, message: "a".repeat(8_193) },
    });

    expect(response.statusCode).toBe(413);
    expect(response.json<{ error: { code: string } }>().error.code).toBe("PAYLOAD_TOO_LARGE");
    expect(store.messages).toEqual([]);
  });
});
