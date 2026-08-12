import { afterEach, describe, expect, it, vi } from "vitest";

import { createBackendClient } from "./backendClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("backendClient", () => {
  it("sends the Clerk token only to the configured backend URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          userId: "user_test",
          sessionId: "session_test",
          organizationId: null,
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = createBackendClient({
      baseUrl: "http://localhost:3001",
      getAccessToken: vi.fn().mockResolvedValue("clerk-test-token"),
    });

    await expect(client.getCurrentIdentity()).resolves.toEqual({
      userId: "user_test",
      sessionId: "session_test",
      organizationId: null,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://localhost:3001/api/v1/me"),
      {
        headers: {
          Authorization: "Bearer clerk-test-token",
        },
      },
    );
  });

  it("does not make a request without a Clerk token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const client = createBackendClient({
      baseUrl: "http://localhost:3001",
      getAccessToken: vi.fn().mockResolvedValue(null),
    });

    await expect(client.getCurrentIdentity()).rejects.toThrow(
      "A Clerk session token is required",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
