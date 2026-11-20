import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { z } from "zod";

import { submitContactMessage, type ContactFormPayload } from "./api";

type Language = "de" | "en";
type ContactValues = Required<Pick<ContactFormPayload, "name" | "email" | "phone" | "subject" | "message" | "website">>;
type ContactField = keyof ContactValues;
type FieldErrors = Partial<Record<ContactField, string>>;

const formSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  website: z.string().trim().max(200),
});

const initialValues: ContactValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  website: "",
};

function fieldMessage(field: ContactField, language: Language) {
  const de = language === "de";
  const labels: Record<ContactField, string> = {
    name: "Name",
    email: "Email",
    phone: de ? "Telefon" : "Phone",
    subject: de ? "Betreff" : "Subject",
    message: de ? "Nachricht" : "Message",
    website: "",
  };
  return de ? labels[field] + " ist ungültig oder fehlt." : labels[field] + " is missing or invalid.";
}

function errorMessage(code: string, language: Language) {
  const de = language === "de";
  if (code === "RATE_LIMITED") {
    return de ? "Zu viele Anfragen. Bitte versuchen Sie es später erneut." : "Too many submissions. Please try again later.";
  }
  return de
    ? "Ihre Nachricht konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
    : "Your message could not be saved. Please try again.";
}

export function ContactForm({ language }: { language: Language }) {
  const de = language === "de";
  const [values, setValues] = useState<ContactValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const update = (field: ContactField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (state !== "idle") setState("idle");
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = formSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as ContactField;
        if (field !== "website") nextErrors[field] = fieldMessage(field, language);
      }
      setErrors(nextErrors);
      setState("error");
      return;
    }

    setState("loading");
    setSubmitError("");

    try {
      await submitContactMessage({
        name: result.data.name,
        email: result.data.email,
        ...(result.data.phone ? { phone: result.data.phone } : {}),
        subject: result.data.subject,
        message: result.data.message,
        website: result.data.website,
      });
      setValues(initialValues);
      setErrors({});
      setState("success");
    } catch (caught) {
      setSubmitError(errorMessage(caught instanceof Error ? caught.message : "", language));
      setState("error");
    }
  }

  const placeholders: Record<Exclude<ContactField, "website">, string> = {
    name: de ? "Max Mustermann" : "John Smith",
    email: de ? "max@example.com" : "john@example.com",
    phone: "+49 170 1234567",
    subject: de ? "Frage zur Fahrzeugaufbereitung" : "Question about vehicle detailing",
    message: de ? "Guten Tag, ich möchte mich über Ihre Leistungen informieren..." : "Hello, I would like to learn more about your services...",
  };

  const fields: Array<{
    name: Exclude<ContactField, "website">;
    label: string;
    required?: boolean;
    type?: "email" | "text";
  }> = [
    { name: "name", label: "Name", required: true },
    { name: "email", label: "Email", required: true, type: "email" },
    { name: "phone", label: de ? "Telefon (optional)" : "Phone (optional)" },
    { name: "subject", label: de ? "Betreff" : "Subject", required: true },
  ];

  return (
    <section className="mt-12 min-w-0 rounded-3xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-8" aria-labelledby="contact-form-heading">
      <div className="max-w-2xl">
        <h2 id="contact-form-heading" className="text-xl font-bold sm:text-2xl">
          {de ? "Nachricht senden" : "Send a message"}
        </h2>
        <p className="mt-2 opacity-70">
          {de
            ? "Ihre Nachricht wird sicher gespeichert. Es wird keine E-Mail automatisch versendet."
            : "Your message is stored securely. No email is sent automatically."}
        </p>
      </div>

      {state === "success" && (
        <div className="alert alert-success mt-6" role="status">
          {de ? "Vielen Dank. Ihre Nachricht wurde sicher gespeichert." : "Thank you. Your message was saved securely."}
        </div>
      )}
      {state === "error" && submitError && (
        <div className="alert alert-error mt-6" role="alert">{submitError}</div>
      )}

      <form className="mt-6 grid gap-4 sm:grid-cols-2" noValidate onSubmit={(event) => void onSubmit(event)}>
        {fields.map((field) => {
          const id = "contact-" + field.name;
          const error = errors[field.name];
          return (
            <label key={field.name} className={field.name === "subject" ? "sm:col-span-2" : ""} htmlFor={id}>
              <span className="mb-1 block text-sm font-semibold">
                {field.label}{field.required ? <span aria-hidden="true"> *</span> : null}
              </span>
              <input
                id={id}
                className="input input-bordered w-full"
                type={field.type ?? "text"}
                value={values[field.name]}
                onChange={(event) => update(field.name, event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? id + "-error" : undefined}
                required={field.required}
                placeholder={placeholders[field.name]}
              />
              {error && <span id={id + "-error"} className="mt-1 block text-sm text-error">{error}</span>}
            </label>
          );
        })}

        <label className="sm:col-span-2" htmlFor="contact-message">
          <span className="mb-1 block text-sm font-semibold">
            {de ? "Nachricht" : "Message"} <span aria-hidden="true">*</span>
          </span>
          <textarea
            id="contact-message"
            className="textarea textarea-bordered min-h-36 w-full"
            value={values.message}
            onChange={(event) => update("message", event.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            required
            placeholder={placeholders.message}
          />
          {errors.message && <span id="contact-message-error" className="mt-1 block text-sm text-error">{errors.message}</span>}
        </label>

        <label className="sr-only" aria-hidden="true" htmlFor="contact-website">
          Website
          <input
            id="contact-website"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </label>

        <div className="sm:col-span-2">
          <button className="btn btn-primary w-full sm:w-auto" disabled={state === "loading"} type="submit">
            {state === "loading" ? <span className="loading loading-spinner loading-sm" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            {state === "loading" ? (de ? "Wird gespeichert…" : "Saving…") : (de ? "Nachricht speichern" : "Save message")}
          </button>
        </div>
      </form>
    </section>
  );
}
