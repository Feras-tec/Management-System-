import { useEffect, useMemo } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "../app/router";
import { createClerkAccessTokenProvider } from "./clerkToken";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to your local .env file before starting the application.",
  );
}

function ClerkRouter() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const getAccessToken = useMemo(
    () => createClerkAccessTokenProvider(getToken),
    [getToken],
  );

  useEffect(() => {
    if (isLoaded) void router.invalidate();
  }, [isLoaded, isSignedIn]);

  const requiresResolvedAuth =
    location.pathname === "/sign-in" || location.pathname.startsWith("/admin");

  if (!isLoaded && requiresResolvedAuth) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-base-200"
        role="status"
        aria-label="Loading authentication"
      >
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <RouterProvider
      router={router}
      context={{
        auth: { isSignedIn: isSignedIn === true, getAccessToken },
      }}
    />
  );
}

export default function ClerkApplication() {
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <ClerkRouter />
    </ClerkProvider>
  );
}
