export interface ContactFormPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  website?: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function contactApiUrl(path: string) {
  if (!apiBaseUrl) throw new Error("Missing VITE_API_BASE_URL.");
  return new URL(path, apiBaseUrl);
}

export async function submitContactMessage(payload: ContactFormPayload) {
  const response = await fetch(contactApiUrl("/api/v1/public/contact-messages"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string };
    } | null;
    throw new Error(body?.error?.code ?? "CONTACT_SUBMISSION_FAILED");
  }
}
