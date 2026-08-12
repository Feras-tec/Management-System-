import type { AccessTokenProvider } from "../auth/auth";

export interface BackendIdentity {
  user: {
    id: string;
    clerkUserId: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    isActive: boolean;
  };
  business: {
    id: string;
    name: string;
    currency: string;
    locale: string;
    timezone: string;
  };
}

interface BackendClientOptions {
  baseUrl: string;
  getAccessToken: AccessTokenProvider;
}

export function createBackendClient(options: BackendClientOptions) {
  const baseUrl = new URL(options.baseUrl);

  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("VITE_API_BASE_URL must use http or https.");
  }

  if (baseUrl.username || baseUrl.password) {
    throw new Error("VITE_API_BASE_URL must not contain credentials.");
  }

  return {
    async getCurrentIdentity(): Promise<BackendIdentity> {
      const token = await options.getAccessToken();

      if (!token) {
        throw new Error("A Clerk session token is required for this request.");
      }

      const response = await fetch(new URL("/api/v1/me", baseUrl), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Backend request failed with status ${response.status}.`,
        );
      }

      return response.json() as Promise<BackendIdentity>;
    },
  };
}
