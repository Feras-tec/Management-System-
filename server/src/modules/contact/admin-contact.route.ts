import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { DataStore } from "../../database/data-store.js";
import type { AuthProvider } from "../../shared/auth/auth-provider.js";
import { requireAdmin, requireApplicationUser } from "../../shared/application-user/require-application-user.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AdminContactStore } from "./contact.types.js";

const id = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/);
const params = z.strictObject({ id });
const listQuery = z.strictObject({
  after: id.optional(),
  limit: z.string().regex(/^\d{1,2}$/).transform(Number).pipe(z.number().int().min(1).max(50)).default(20),
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "The request is invalid.");
  return result.data;
}

export function registerAdminContactRoutes(app: FastifyInstance, store: AdminContactStore, auth: AuthProvider, dataStore: DataStore) {
  const options = { onRequest: async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header("Cache-Control", "no-store");
  } };
  async function getAdmin(request: FastifyRequest) {
    const user = await requireApplicationUser(request, auth, dataStore);
    requireAdmin(user.role);
    return user;
  }

  app.get("/api/v1/contact-messages", options, async request => {
    const user = await getAdmin(request);
    const { limit, after } = parse(listQuery, request.query);
    const page = await store.listMessages(user.businessId, limit, after);
    if (!page) throw new AppError(404, "CONTACT_CURSOR_NOT_FOUND", "The cursor was not found.");
    return page;
  });

  app.get("/api/v1/contact-messages/:id", options, async request => {
    const user = await getAdmin(request);
    const message = await store.findMessage(user.businessId, parse(params, request.params).id);
    if (!message) throw new AppError(404, "CONTACT_MESSAGE_NOT_FOUND", "The message was not found.");
    return message;
  });
}
