import type { FastifyInstance } from "fastify";
import type { AuthProvider } from "../../shared/auth/auth-provider.js";
import type { DataStore } from "../../database/data-store.js";
import { requireAdmin, requireApplicationUser, requireServiceManager } from "../../shared/application-user/require-application-user.js";
import { AppError } from "../../shared/errors/app-error.js";
import { updateSettingsSchema } from "./settings.schema.js";
import { PrismaSettingsStore } from "./prisma-settings.store.js";

export function registerSettingsRoutes(app: FastifyInstance, auth: AuthProvider, data: DataStore, store: PrismaSettingsStore) {
  app.get("/api/v1/settings", async (request) => { const user = await requireApplicationUser(request, auth, data); requireServiceManager(user.role); return { ...await store.get(user.businessId), canEdit: user.role === "ADMIN" }; });
  app.patch("/api/v1/settings", async (request) => { const user = await requireApplicationUser(request, auth, data); requireAdmin(user.role); const parsed = updateSettingsSchema.safeParse(request.body); if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "The settings are invalid."); return { ...await store.update(user.businessId, parsed.data), canEdit: true }; });
}
