import { redirect } from "@tanstack/react-router";

export type AccessTokenProvider = () => Promise<string | null>;

export interface AuthContext {
  isSignedIn: boolean;
  getAccessToken: AccessTokenProvider;
}

export function getSafeRedirectPath(redirectPath: string) {
  return redirectPath.startsWith("/") && !redirectPath.startsWith("//")
    ? redirectPath
    : "/admin";
}

export function requireAuthentication(auth: AuthContext, redirectPath: string) {
  if (auth.isSignedIn) {
    return;
  }

  throw redirect({
    to: "/sign-in",
    search: {
      redirect: getSafeRedirectPath(redirectPath),
    },
  });
}
