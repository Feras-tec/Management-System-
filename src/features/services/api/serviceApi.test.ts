import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicServices } from "./serviceApi";

afterEach(() => vi.unstubAllGlobals());

describe("public services client", () => {
  it("calls the public Backend endpoint without Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getPublicServices();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit?];
    expect(url.pathname).toBe("/api/v1/public/services");
    expect(options?.headers).toBeUndefined();
  });
});
