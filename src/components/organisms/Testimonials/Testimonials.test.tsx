// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Testimonials } from "./Testimonials";

afterEach(cleanup);

function renderTestimonials(language: "de" | "en", withApprovedReview = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(["public", "reviews"], withApprovedReview ? [{
    id: "approved-1",
    customerName: "Approved reviewer",
    rating: 4,
    message: "A review published after moderation.",
    createdAt: "2026-11-19T08:00:00.000Z",
  }] : []);
  return render(<QueryClientProvider client={client}><Testimonials language={language} /></QueryClientProvider>);
}

vi.mock("../../motion/Reveal", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Testimonials", () => {
  it("labels fictional profiles once and in plain language", () => {
    renderTestimonials("en");
    expect(screen.getByRole("heading", { name: "What the AutoCare experience could feel like" })).toBeVisible();
    expect(screen.queryByText("DEMO")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Rating: 5 out of 5 stars")).toHaveLength(3);
    expect(screen.getByText("Max M.")).toBeVisible();
    expect(screen.getByText("Anna S.")).toBeVisible();
    expect(screen.getByText("Daniel K.")).toBeVisible();
    expect(screen.getAllByRole("img", { name: /Demo portrait/i })).toHaveLength(3);
    expect(screen.getByRole("note")).toHaveTextContent(/fictional/i);
    expect(screen.getByRole("note")).toHaveTextContent(/not genuine customer reviews/i);
    expect(screen.getByRole("group", { name: "Fictional example reviews" })).toHaveAccessibleDescription(
      "Fictional examples: Not genuine customer reviews. They do not count toward rating averages.",
    );
  });

  it("renders German labels and disclosure accessibly", () => {
    renderTestimonials("de");
    expect(screen.getByRole("heading", { name: "So könnte sich AutoCare anfühlen" })).toBeVisible();
    expect(screen.getAllByLabelText("Bewertung: 5 von 5 Sternen")).toHaveLength(3);
    expect(screen.getByRole("group", { name: "Fiktive Beispielbewertungen" })).toHaveAccessibleDescription(
      "Fiktive Beispiele: Keine echten Kundenbewertungen. Sie zählen nicht zum Bewertungsdurchschnitt.",
    );
  });

  it("keeps approved reviews outside the fictional examples group", () => {
    renderTestimonials("en", true);
    const examples = screen.getByRole("group", { name: "Fictional example reviews" });
    const approved = screen.getByRole("region", { name: "Approved customer reviews" });
    expect(within(examples).getByText("Max M.")).toBeVisible();
    expect(within(examples).queryByText("Approved reviewer")).not.toBeInTheDocument();
    expect(within(approved).getByText("Approved reviewer")).toBeVisible();
    expect(within(approved).queryByRole("note")).not.toBeInTheDocument();
  });
});
