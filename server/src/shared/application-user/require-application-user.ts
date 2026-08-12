import type { FastifyRequest } from "fastify";

import type { DataStore, ApplicationUser, UserRole } from "../../database/data-store.js";
import type { AuthProvider } from "../auth/auth-provider.js";
import { requireAuthentication } from "../auth/require-auth.js";
import { AppError } from "../errors/app-error.js";

export async function requireApplicationUser(
  request: FastifyRequest,
  authProvider: AuthProvider,
  dataStore: DataStore,
): Promise<ApplicationUser> {
  const identity = await requireAuthentication(request, authProvider);
  const user = await dataStore.findUserByClerkId(identity.userId);

  if (!user) {
    throw new AppError(
      403,
      "APPLICATION_USER_REQUIRED",
      "This account has not been provisioned for the application.",
    );
  }
  if (!user.isActive) {
    throw new AppError(403, "USER_INACTIVE", "This application user is inactive.");
  }
  return user;
}

export function requireServiceManager(role: UserRole) {
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new AppError(403, "FORBIDDEN", "This action is not permitted.");
  }
}

export function requireAdmin(role: UserRole) {
  if (role !== "ADMIN") throw new AppError(403, "FORBIDDEN", "Administrator access is required.");
}
