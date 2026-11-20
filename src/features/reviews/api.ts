import type { AccessTokenProvider } from "../../auth/auth";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PublicReview {
  id: string;
  customerName: string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface AdminReview extends PublicReview {
  email: string | null;
  status: ReviewStatus;
  updatedAt: string;
}

export interface AdminReviewList {
  items: AdminReview[];
  total: number;
  page: number;
  limit: number;
}

export interface ReviewPayload {
  customerName: string;
  rating: number;
  message: string;
  email?: string;
  website?: string;
}

const base = import.meta.env.VITE_API_BASE_URL;

function url(path: string) {
  if (!base) throw new Error("Missing VITE_API_BASE_URL.");
  return new URL(path, base);
}

async function read<T>(responseInput: Response | Promise<Response>) {
  const response = await responseInput;
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string };
    } | null;
    throw new Error(body?.error?.code ?? "REVIEW_FAILED");
  }
  return response.json() as Promise<T>;
}

async function authorized<T>(
  path: string,
  token: AccessTokenProvider,
  init?: RequestInit,
) {
  const value = await token();
  if (!value) throw new Error("AUTH_REQUIRED");
  return read<T>(
    fetch(url(path), {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        Authorization: "Bearer " + value,
        ...init?.headers,
      },
    }),
  );
}

export const reviewApi = {
  list: () => read<PublicReview[]>(fetch(url("/api/v1/public/reviews"))),
  submit: (body: ReviewPayload) =>
    read<{ id: string; status: "PENDING" }>(
      fetch(url("/api/v1/public/reviews"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),
  adminList: (token: AccessTokenProvider, query: string) =>
    authorized<AdminReviewList>("/api/v1/reviews?" + query, token),
  moderate: (
    token: AccessTokenProvider,
    id: string,
    status: "APPROVED" | "REJECTED",
  ) =>
    authorized<{ id: string; status: ReviewStatus }>(
      "/api/v1/reviews/" + id + "/status",
      token,
      { method: "PATCH", body: JSON.stringify({ status }) },
    ),
};
