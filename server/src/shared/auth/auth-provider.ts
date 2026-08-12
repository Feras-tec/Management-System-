import type { FastifyRequest } from "fastify";

export interface VerifiedIdentity {
  userId: string;
  sessionId: string | null;
  organizationId: string | null;
}

export interface AuthProvider {
  getIdentity(
    request: FastifyRequest,
  ): VerifiedIdentity | null | Promise<VerifiedIdentity | null>;
}
