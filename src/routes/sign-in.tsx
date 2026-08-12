import { SignIn } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getSafeRedirectPath } from "../auth/auth";
import { usePageMeta } from "../utils/usePageMeta";

const signInSearchSchema = z.object({
  redirect: z.string().optional().catch("/admin"),
});

export const Route = createFileRoute("/sign-in")({
  validateSearch: signInSearchSchema,
  component: SignInPage,
});

function SignInPage() {
  const { redirect = "/admin" } = Route.useSearch();
  usePageMeta("Sign in", "Secure sign in to the AutoCare administration area.");

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <SignIn
        routing="virtual"
        fallbackRedirectUrl={getSafeRedirectPath(redirect)}
      />
    </main>
  );
}
