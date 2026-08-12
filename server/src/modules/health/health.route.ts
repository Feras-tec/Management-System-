import type { FastifyInstance } from "fastify";

export function registerHealthRoute(app: FastifyInstance) {
  app.get("/health", () => ({ status: "ok" as const }));
}
