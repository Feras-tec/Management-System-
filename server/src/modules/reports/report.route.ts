import type { FastifyInstance } from "fastify";
import type { z } from "zod";
import type { DataStore } from "../../database/data-store.js";
import type { AuthProvider } from "../../shared/auth/auth-provider.js";
import { requireApplicationUser, requireServiceManager } from "../../shared/application-user/require-application-user.js";
import { AppError } from "../../shared/errors/app-error.js";
import { reportRangeQuery } from "./report.schema.js";
import type { ReportStore } from "./report.types.js";

function parse<T>(schema: z.ZodType<T>, value: unknown) { const result = schema.safeParse(value); if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "The report range is invalid."); return result.data; }

export function registerReportRoutes(app: FastifyInstance, auth: AuthProvider, data: DataStore, store: ReportStore) {
  app.get("/api/v1/reports/overview", async (request) => {
    const user = await requireApplicationUser(request, auth, data);
    requireServiceManager(user.role);
    const query = parse(reportRangeQuery, request.query);
    return store.overview(user.businessId, query);
  });
}
