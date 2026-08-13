import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "./app/router";
import { QueryProvider, ConfirmDialogProvider } from "./providers";
import { AppPreferencesProvider } from "./context";
import ToastProvider from "./providers/ToastProvider";
import "./index.css";

const ClerkApplication = lazy(() => import("./auth/ClerkApplication"));

const publicAuth = {
  isSignedIn: false,
  getAccessToken: async () => null,
};

function Application() {
  const needsClerk = location.pathname === "/sign-in" || location.pathname.startsWith("/admin");

  if (needsClerk) {
    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-base-200" role="status" aria-label="Loading authentication"><span className="loading loading-spinner loading-lg" /></div>}>
        <ClerkApplication />
      </Suspense>
    );
  }

  return <RouterProvider router={router} context={{ auth: publicAuth }} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppPreferencesProvider>
      <QueryProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <Application />
          </ConfirmDialogProvider>
        </ToastProvider>
      </QueryProvider>
    </AppPreferencesProvider>
  </StrictMode>,
);
