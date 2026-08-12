import type { FastifyInstance } from "fastify";

import type { ServerEnvironment } from "../config/env.js";
import type { AuthProvider } from "../shared/auth/auth-provider.js";

export async function registerClerkAuthentication(
  app: FastifyInstance,
  environment: ServerEnvironment,
): Promise<AuthProvider> {
  const { clerkPlugin, getAuth } = await import("@clerk/fastify");

  await app.register(clerkPlugin, {
    publishableKey: environment.CLERK_PUBLISHABLE_KEY,
    secretKey: environment.CLERK_SECRET_KEY,
  });

  return {
    getIdentity(request) {
      const auth = getAuth(request);

      if (!auth.isAuthenticated || !auth.userId) {
        return null;
      }

      return {
        userId: auth.userId,
        sessionId: auth.sessionId ?? null,
        organizationId: auth.orgId ?? null,
      };
    },
  };
}
