import { StrictMode, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";

import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "./app/router";

import { QueryProvider, ConfirmDialogProvider } from "./providers";

import { AppPreferencesProvider } from "./context";

import ToastProvider from "./providers/ToastProvider";

import "./index.css";

import { createClerkAccessTokenProvider } from "./auth/clerkToken";

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
    if (isLoaded) {
      void router.invalidate();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
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
        auth: {
          isSignedIn: isSignedIn === true,
          getAccessToken,
        },
      }}
    />
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <AppPreferencesProvider>
        <QueryProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <ClerkRouter />
            </ConfirmDialogProvider>
          </ToastProvider>
        </QueryProvider>
      </AppPreferencesProvider>
    </ClerkProvider>
  </StrictMode>,
);
