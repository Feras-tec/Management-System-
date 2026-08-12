import type { FastifyInstance } from "fastify";
import type { z } from "zod";

import type { DataStore, ServiceRecord, UpdateServiceData } from "../../database/data-store.js";
import type { AuthProvider } from "../../shared/auth/auth-provider.js";
import {
  requireApplicationUser,
  requireServiceManager,
} from "../../shared/application-user/require-application-user.js";
import { AppError } from "../../shared/errors/app-error.js";
import {
  createServiceSchema,
  serviceIdParamsSchema,
  serviceSlugParamsSchema,
  updateServiceSchema,
} from "./service.schema.js";

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", "The request is invalid.");
  }
  return result.data;
}

function toServiceDto(service: ServiceRecord) {
  const { businessId: _businessId, ...dto } = service;
  void _businessId;
  return dto;
}

export function registerPublicServiceRoutes(app: FastifyInstance, dataStore: DataStore) {
  app.get("/api/v1/public/services", async () => {
    const services = await dataStore.listPublicServices();
    return services.map(toServiceDto);
  });

  app.get("/api/v1/public/services/:slug", async (request) => {
    const { slug } = parse(serviceSlugParamsSchema, request.params);
    const service = await dataStore.findPublicServiceBySlug(slug);
    if (!service) {
      throw new AppError(404, "SERVICE_NOT_FOUND", "Service not found.");
    }
    return toServiceDto(service);
  });
}

export function registerAdminServiceRoutes(
  app: FastifyInstance,
  authProvider: AuthProvider,
  dataStore: DataStore,
) {
  app.get("/api/v1/services", async (request) => {
    const user = await requireApplicationUser(request, authProvider, dataStore);
    const services = await dataStore.listServices(user.businessId);
    return services.map(toServiceDto);
  });

  app.post("/api/v1/services", async (request, reply) => {
    const user = await requireApplicationUser(request, authProvider, dataStore);
    requireServiceManager(user.role);
    const input = parse(createServiceSchema, request.body);
    const service = await dataStore.createService({
      ...input,
      imageUrl: input.imageUrl ?? null,
      businessId: user.businessId,
    });
    return reply.code(201).send(toServiceDto(service));
  });

  app.get("/api/v1/services/:serviceId", async (request) => {
    const user = await requireApplicationUser(request, authProvider, dataStore);
    const { serviceId } = parse(serviceIdParamsSchema, request.params);
    const service = await dataStore.findService(user.businessId, serviceId);
    if (!service) {
      throw new AppError(404, "SERVICE_NOT_FOUND", "Service not found.");
    }
    return toServiceDto(service);
  });

  app.patch("/api/v1/services/:serviceId", async (request) => {
    const user = await requireApplicationUser(request, authProvider, dataStore);
    requireServiceManager(user.role);
    const { serviceId } = parse(serviceIdParamsSchema, request.params);
    const input = parse(updateServiceSchema, request.body);
    const updates = Object.fromEntries(
      Object.entries(input).filter((entry) => entry[1] !== undefined),
    ) as UpdateServiceData;
    const service = await dataStore.updateService(
      user.businessId,
      serviceId,
      updates,
    );
    if (!service) {
      throw new AppError(404, "SERVICE_NOT_FOUND", "Service not found.");
    }
    return toServiceDto(service);
  });

  app.delete("/api/v1/services/:serviceId", async (request) => {
    const user = await requireApplicationUser(request, authProvider, dataStore);
    requireServiceManager(user.role);
    const { serviceId } = parse(serviceIdParamsSchema, request.params);
    const service = await dataStore.updateService(user.businessId, serviceId, {
      isActive: false,
    });
    if (!service) {
      throw new AppError(404, "SERVICE_NOT_FOUND", "Service not found.");
    }
    return toServiceDto(service);
  });
}
