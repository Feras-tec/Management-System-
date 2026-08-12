import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication, type AuthContext } from "./auth";

function createAuthContext(isSignedIn: boolean): AuthContext {
  return {
    isSignedIn,
    getAccessToken: vi.fn().mockResolvedValue(null),
  };
}

describe("requireAuthentication", () => {
  it("allows a signed-in user to access the admin route", () => {
    expect(() =>
      requireAuthentication(createAuthContext(true), "/admin/products"),
    ).not.toThrow();
  });

  it("redirects a signed-out user before the admin route can render", () => {
    try {
      requireAuthentication(createAuthContext(false), "/admin/products");
      throw new Error("Expected the authentication guard to redirect");
    } catch (error) {
      expect(isRedirect(error)).toBe(true);

      if (!isRedirect(error)) return;

      expect(error.options.to).toBe("/sign-in");
      expect(error.options.search).toEqual({ redirect: "/admin/products" });
    }
  });

  it("does not allow an external redirect target", () => {
    try {
      requireAuthentication(createAuthContext(false), "https://example.com");
    } catch (error) {
      expect(isRedirect(error)).toBe(true);

      if (!isRedirect(error)) return;

      expect(error.options.search).toEqual({ redirect: "/admin" });
    }
  });
});
