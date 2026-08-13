import { Suspense, lazy } from "react";

const ClerkApplication = lazy(() => import("./auth/ClerkApplication"));

function AuthenticationLoading() {
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

/**
 * The router is always rendered below the application's single ClerkProvider.
 * Public routes remain public, while every Clerk control can safely consume the
 * same session context as the protected admin routes.
 */
export default function Application() {
  return (
    <Suspense fallback={<AuthenticationLoading />}>
      <ClerkApplication />
    </Suspense>
  );
}
