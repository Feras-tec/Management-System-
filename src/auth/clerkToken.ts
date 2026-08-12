import type { AccessTokenProvider } from "./auth";

type ClerkGetToken = () => Promise<string | null>;

export function createClerkAccessTokenProvider(
  getToken: ClerkGetToken,
): AccessTokenProvider {
  return () => getToken();
}
