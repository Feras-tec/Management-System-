// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "./ContactForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ContactForm", () => {
  it("uses professional localized placeholder examples while keeping visible labels", () => {
    const { rerender } = render(<ContactForm language="de" />);

    expect(screen.getByLabelText("Name *")).toHaveAttribute("placeholder", "Max Mustermann");
    expect(screen.getByLabelText("Email *")).toHaveAttribute("placeholder", "max@example.com");
    expect(screen.getByLabelText("Telefon (optional)")).toHaveAttribute("placeholder", "+49 170 1234567");
    expect(screen.getByLabelText("Betreff *")).toHaveAttribute("placeholder", "Frage zur Fahrzeugaufbereitung");
    expect(screen.getByLabelText("Nachricht *")).toHaveAttribute("placeholder", "Guten Tag, ich möchte mich über Ihre Leistungen informieren...");

    rerender(<ContactForm language="en" />);
    expect(screen.getByLabelText("Name *")).toHaveAttribute("placeholder", "John Smith");
    expect(screen.getByLabelText("Email *")).toHaveAttribute("placeholder", "john@example.com");
    expect(screen.getByLabelText("Phone (optional)")).toHaveAttribute("placeholder", "+49 170 1234567");
    expect(screen.getByLabelText("Subject *")).toHaveAttribute("placeholder", "Question about vehicle detailing");
    expect(screen.getByLabelText("Message *")).toHaveAttribute("placeholder", "Hello, I would like to learn more about your services...");
  });

  it("shows localized client validation errors without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm language="en" />);

    await userEvent.click(screen.getByRole("button", { name: "Save message" }));

    expect(screen.getByText("Name is missing or invalid.")).toBeVisible();
    expect(screen.getByText("Message is missing or invalid.")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits normalized form data and confirms secure storage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ accepted: true }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm language="en" />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name *"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email *"), "ada@example.test");
    await user.type(screen.getByLabelText("Subject *"), "Appointment question");
    await user.type(screen.getByLabelText("Message *"), "I would like to ask about an appointment next week.");
    await user.click(screen.getByRole("button", { name: "Save message" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/v1/public/contact-messages");
    expect(JSON.parse(String(request.body))).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.test",
      subject: "Appointment question",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Your message was saved securely.");
  });

  it("shows a useful server error and preserves the entered message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "RATE_LIMITED" } }), { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm language="de" />);

    fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "ada@example.test" } });
    fireEvent.change(screen.getByLabelText("Betreff *"), { target: { value: "Terminfrage" } });
    fireEvent.change(screen.getByLabelText("Nachricht *"), { target: { value: "Ich möchte einen Termin für nächste Woche anfragen." } });
    fireEvent.submit(screen.getByRole("button", { name: "Nachricht speichern" }).closest("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Zu viele Anfragen");
    expect(screen.getByLabelText("Nachricht *")).toHaveValue("Ich möchte einen Termin für nächste Woche anfragen.");
  });
});
