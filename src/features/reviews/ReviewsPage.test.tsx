// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppPreferencesProvider } from "../../context";
import { ReviewsPage } from "./ReviewsPage";
import { reviewApi, type AdminReview } from "./api";

const token = () => Promise.resolve("test-token");

const pendingReview: AdminReview = {
  id: "rev-1",
  customerName: "Ada Lovelace",
  rating: 5,
  message: "A very clear and helpful booking experience.",
  email: "ada@example.test",
  status: "PENDING",
  createdAt: "2026-11-18T10:00:00.000Z",
  updatedAt: "2026-11-18T10:00:00.000Z",
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <AppPreferencesProvider>
      <QueryClientProvider client={client}>
        <ReviewsPage token={token} />
      </QueryClientProvider>
    </AppPreferencesProvider>,
  );
}

beforeEach(() => {
  localStorage.setItem("language", "en");
  vi.spyOn(reviewApi, "adminList").mockResolvedValue({
    items: [pendingReview],
    total: 1,
    page: 1,
    limit: 12,
  });
  vi.spyOn(reviewApi, "moderate").mockResolvedValue({
    id: "rev-1",
    status: "APPROVED",
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("ReviewsPage", () => {
  it("lists pending reviews with private email and moderation actions", async () => {
    renderPage();

    expect(await screen.findByText("Ada Lovelace")).toBeVisible();
    expect(
      screen.getByText("A very clear and helpful booking experience."),
    ).toBeVisible();
    expect(screen.getByText("ada@example.test")).toBeVisible();
    expect(screen.getByText("Private")).toBeVisible();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Approve" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Reject" })).toBeVisible();
    expect(reviewApi.adminList).toHaveBeenCalledWith(
      token,
      "page=1&limit=12&status=PENDING",
    );
  });

  it("approves a review through the existing API", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(reviewApi.moderate).toHaveBeenCalledWith(
        token,
        "rev-1",
        "APPROVED",
      ),
    );
  });

  it("shows localized German labels and empty state", async () => {
    localStorage.setItem("language", "de");
    vi.spyOn(reviewApi, "adminList").mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 12,
    });
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Bewertungen" }),
    ).toBeVisible();
    expect(
      await screen.findByText("Keine Bewertungen für diesen Filter."),
    ).toBeVisible();
  });

  it("shows the administrator-only error from the backend", async () => {
    vi.spyOn(reviewApi, "adminList").mockRejectedValue(new Error("FORBIDDEN"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only administrators can moderate reviews.",
    );
  });
});
