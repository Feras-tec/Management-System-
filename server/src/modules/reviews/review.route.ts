import type { FastifyInstance } from "fastify";
import type { z } from "zod";

import type { AuthProvider } from "../../shared/auth/auth-provider.js";
import { requireAdmin, requireApplicationUser } from "../../shared/application-user/require-application-user.js";
import type { DataStore } from "../../database/data-store.js";
import { AppError } from "../../shared/errors/app-error.js";
import { createSubmissionLimit } from "../../shared/http/submission-limit.js";
import {
  adminReviewListSchema,
  createReviewSchema,
  reviewIdSchema,
  reviewStatusSchema,
} from "./review.schema.js";
import type { ReviewStore } from "./review.types.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS = 3;

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "The request is invalid.");
  return result.data;
}

export function registerPublicReviewRoutes(app: FastifyInstance, store: ReviewStore) {
  const allowSubmission = createSubmissionLimit(WINDOW_MS, MAX_SUBMISSIONS);

  app.get("/api/v1/public/reviews", async () => {
    const businessId = await store.findPublicBusinessId();
    return businessId ? store.listApproved(businessId) : [];
  });

  app.post("/api/v1/public/reviews", { bodyLimit: 8_192 }, async (request, reply) => {
    const input = parse(createReviewSchema, request.body);
    if (input.website) throw new AppError(400, "SPAM_DETECTED", "The request is invalid.");

    if (!allowSubmission(request.ip)) {
      throw new AppError(429, "RATE_LIMITED", "Too many submissions. Please try again later.");
    }
    const businessId = await store.findPublicBusinessId();
    if (!businessId) throw new AppError(503, "REVIEWS_UNAVAILABLE", "Reviews are temporarily unavailable.");

    const review = await store.create(businessId, {
      customerName: input.customerName,
      rating: input.rating,
      message: input.message,
      ...(input.email ? { email: input.email } : {}),
    });
    return reply.code(201).send({ id: review.id, status: review.status });
  });
}

export function registerAdminReviewRoutes(
  app: FastifyInstance,
  store: ReviewStore,
  auth: AuthProvider,
  dataStore: DataStore,
) {
  app.get("/api/v1/reviews", async (request, reply) => {
    const user = await requireApplicationUser(request, auth, dataStore);
    requireAdmin(user.role);
    const query = parse(adminReviewListSchema, request.query);
    const result = await store.listForAdmin(user.businessId, query);
    reply.header("Cache-Control", "no-store");
    return result;
  });

  app.patch("/api/v1/reviews/:reviewId/status", async (request, reply) => {
    const user = await requireApplicationUser(request, auth, dataStore);
    requireAdmin(user.role);
    const { reviewId } = parse(reviewIdSchema, request.params);
    const { status } = parse(reviewStatusSchema, request.body);
    const review = await store.updateStatus(user.businessId, reviewId, status);
    if (!review) throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found.");
    reply.header("Cache-Control", "no-store");
    return review;
  });
}
