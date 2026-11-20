import type { FastifyInstance } from "fastify";
import type { z } from "zod";

import { AppError } from "../../shared/errors/app-error.js";
import { createSubmissionLimit } from "../../shared/http/submission-limit.js";
import { contactSubmissionSchema } from "./contact.schema.js";
import type { ContactStore } from "./contact.types.js";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", "The request is invalid.");
  }

  return result.data;
}

export function registerPublicContactRoutes(
  app: FastifyInstance,
  store: ContactStore,
) {
  const allowSubmission = createSubmissionLimit(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_SUBMISSIONS);

  app.post(
    "/api/v1/public/contact-messages",
    { bodyLimit: 8_192 },
    async (request, reply) => {
      const input = parse(contactSubmissionSchema, request.body);

      if (input.website) {
        throw new AppError(400, "SPAM_DETECTED", "The request is invalid.");
      }

      if (!allowSubmission(request.ip)) {
        throw new AppError(
          429,
          "RATE_LIMITED",
          "Too many submissions. Please try again later.",
        );
      }

      const businessId = await store.findPublicBusinessId();
      if (!businessId) {
        throw new AppError(
          503,
          "CONTACT_UNAVAILABLE",
          "Contact messages are temporarily unavailable.",
        );
      }

      await store.createMessage(businessId, {
        name: input.name,
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
        subject: input.subject,
        message: input.message,
      });

      return reply.code(201).send({ accepted: true });
    },
  );
}
