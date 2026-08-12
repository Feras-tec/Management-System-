import type { FastifyRequest } from "fastify";

import type { AuthProvider, VerifiedIdentity } from "./auth-provider.js";
import { AppError } from "../errors/app-error.js";

export async function requireAuthentication(
  request: FastifyRequest,
  authProvider: AuthProvider,
): Promise<VerifiedIdentity> {
  const identity = await authProvider.getIdentity(request);

  if (!identity) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  return identity;
}
