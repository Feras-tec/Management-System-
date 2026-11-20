// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { AppPreferencesProvider } from "../../context";
import { adminContactApi } from "./adminContactApi";
import { ContactMessagesPage } from "./ContactMessagesPage";

const token = async () => "test-token";
const item = { id: "a", subject: "Appointment question", createdAt: "2026-11-19T12:00:00Z" };

function show(language = "en") {
  localStorage.setItem("language", language);
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><AppPreferencesProvider>
    <ContactMessagesPage token={token} sessionId="test-session" />
  </AppPreferencesProvider></QueryClientProvider>);
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

it("loads private detail only when opened, hides it on close and paginates", async () => {
  const list = vi.spyOn(adminContactApi, "list").mockImplementation(async (_token, cursor) => cursor
    ? { items: [], nextCursor: null }
    : { items: [item], nextCursor: "a" });
  const detail = vi.spyOn(adminContactApi, "detail").mockResolvedValue({
    ...item, name: "Sample Sender", email: "private@example.test", phone: null, message: "Private message",
  });
  const user = userEvent.setup();
  show();
  expect(screen.getByRole("status")).toHaveTextContent("Loading messages");
  const subject = await screen.findByRole("button", { name: /Appointment question/ });
  expect(detail).not.toHaveBeenCalled();
  expect(screen.queryByText("private@example.test")).not.toBeInTheDocument();
  await user.click(subject);
  expect(await screen.findByText("private@example.test")).toBeVisible();
  expect(detail).toHaveBeenCalledWith(token, "a", expect.any(AbortSignal));
  expect(subject).toHaveAttribute("aria-expanded", "true");
  await user.click(subject);
  expect(screen.queryByText("private@example.test")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(await screen.findByText("No contact messages.")).toBeVisible();
  expect(list).toHaveBeenLastCalledWith(token, "a", expect.any(AbortSignal));
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(await screen.findByRole("button", { name: /Appointment question/ })).toBeVisible();
});

it("shows a localized authorization error and can retry into the empty state", async () => {
  const list = vi.spyOn(adminContactApi, "list").mockRejectedValueOnce(new Error("403"))
    .mockResolvedValue({ items: [], nextCursor: null });
  show("de");
  expect(screen.getByRole("heading", { name: "Kontaktanfragen" })).toBeVisible();
  expect(await screen.findByRole("alert")).toHaveTextContent("Nur Administratoren haben Zugriff.");
  await userEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
  expect(await screen.findByText("Keine Kontaktanfragen vorhanden.")).toBeVisible();
  await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
});
