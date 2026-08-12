import { describe, expect, it } from "vitest";

import { parseEnvironment } from "../src/config/env.js";

describe("parseEnvironment", () => {
  it("parses and normalizes the required configuration", () => {
    const environment = parseEnvironment({
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: "3100",
      LOG_LEVEL: "silent",
      FRONTEND_ORIGIN: "http://localhost:5173",
      CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
      DATABASE_URL: "postgresql://USER:PASSWORD@HOST:PORT/DATABASE",
      CLERK_SECRET_KEY: "sk_test_placeholder",
    });

    expect(environment.PORT).toBe(3100);
    expect(environment.NODE_ENV).toBe("test");
  });

  it("reports invalid variable names without exposing their values", () => {
    const secretValue = "must-never-appear";

    expect(() =>
      parseEnvironment({
        FRONTEND_ORIGIN: "not-a-url",
        CLERK_PUBLISHABLE_KEY: "",
        CLERK_SECRET_KEY: secretValue,
      }),
    ).toThrowError(/FRONTEND_ORIGIN, CLERK_PUBLISHABLE_KEY/);

    try {
      parseEnvironment({
        FRONTEND_ORIGIN: "not-a-url",
        CLERK_PUBLISHABLE_KEY: "",
        CLERK_SECRET_KEY: secretValue,
      });
    } catch (error) {
      expect(String(error)).not.toContain(secretValue);
    }
  });
});
