import type { AccessTokenProvider } from "../../auth/auth";

export interface ContactSummary {
  id: string;
  subject: string;
  createdAt: string;
}

export interface ContactDetail extends ContactSummary {
  name: string;
  email: string;
  phone: string | null;
  message: string;
}

export interface ContactPage {
  items: ContactSummary[];
  nextCursor: string | null;
}

async function load<T>(path: string, token: AccessTokenProvider, signal?: AbortSignal): Promise<T> {
  const value = await token();
  if (!value) throw new Error("AUTH_REQUIRED");
  const url = new URL(path, import.meta.env.VITE_API_BASE_URL);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${value}` },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<T>;
}

export const adminContactApi = {
  list(token: AccessTokenProvider, cursor: string | null, signal?: AbortSignal) {
    const query = new URLSearchParams({ limit: "20" });
    if (cursor) query.set("after", cursor);
    return load<ContactPage>(`/api/v1/contact-messages?${query}`, token, signal);
  },
  detail(token: AccessTokenProvider, id: string, signal?: AbortSignal) {
    return load<ContactDetail>(`/api/v1/contact-messages/${encodeURIComponent(id)}`, token, signal);
  },
};
