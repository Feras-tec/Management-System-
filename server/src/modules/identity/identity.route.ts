import type { FastifyInstance } from "fastify";

import type { DataStore } from "../../database/data-store.js";
import type { AuthProvider } from "../../shared/auth/auth-provider.js";
import { requireApplicationUser } from "../../shared/application-user/require-application-user.js";

export function registerIdentityRoutes(
  app: FastifyInstance,
  authProvider: AuthProvider,
  dataStore: DataStore,
) {
  app.get("/api/v1/me", async (request) => {
    const user = await requireApplicationUser(request, authProvider, dataStore);

    return {
      user: {
        id: user.id,
        clerkUserId: user.clerkUserId,
        role: user.role,
        isActive: user.isActive,
      },
      business: {
        id: user.business.id,
        name: user.business.name,
        currency: user.business.currency,
        locale: user.business.locale,
        timezone: user.business.timezone,
      },
    };
  });
}
