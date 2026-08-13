// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const clerkState = vi.hoisted(() => ({
  providerRenders: 0,
  isLoaded: true,
}));

vi.mock("@clerk/clerk-react", async () => {
  const { createElement } = await import("react");

  return {
    ClerkProvider: ({ children }: { children: ReactNode }) => {
      clerkState.providerRenders += 1;
      return createElement("div", { "data-testid": "clerk-provider" }, children);
    },
    useAuth: () => ({
      isLoaded: clerkState.isLoaded,
      isSignedIn: false,
      getToken: vi.fn(),
    }),
  };
});

vi.mock("@tanstack/react-router", () => ({
  RouterProvider: () => <div data-testid="router-provider" />,
}));

vi.mock("../app/router", () => ({
  router: { invalidate: vi.fn() },
}));

import ClerkApplication from "./ClerkApplication";

describe("ClerkApplication", () => {
  afterEach(() => {
    cleanup();
    clerkState.providerRenders = 0;
    clerkState.isLoaded = true;
    window.history.pushState({}, "", "/");
  });

  it("places the router below exactly one application ClerkProvider", () => {
    render(<ClerkApplication />);

    expect(screen.getAllByTestId("clerk-provider")).toHaveLength(1);
    expect(screen.getByTestId("clerk-provider")).toContainElement(
      screen.getByTestId("router-provider"),
    );
  });

  it("renders public routes while Clerk resolves its session", () => {
    clerkState.isLoaded = false;
    window.history.pushState({}, "", "/");

    render(<ClerkApplication />);

    expect(screen.getByTestId("router-provider")).toBeInTheDocument();
  });

  it("waits for Clerk before rendering protected routes", () => {
    clerkState.isLoaded = false;
    window.history.pushState({}, "", "/admin");

    render(<ClerkApplication />);

    expect(screen.getByRole("status", { name: "Loading authentication" })).toBeVisible();
    expect(screen.queryByTestId("router-provider")).not.toBeInTheDocument();
  });
});
