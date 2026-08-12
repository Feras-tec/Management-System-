import type { FastifyInstance } from "fastify";

import { AppError } from "../shared/errors/app-error.js";
import { createErrorResponse } from "../shared/errors/error-response.js";

export function registerErrorHandling(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    return reply
      .code(404)
      .send(createErrorResponse("NOT_FOUND", "Route not found.", request.id));
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply
        .code(error.statusCode)
        .send(createErrorResponse(error.code, error.message, request.id));
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "validation" in error &&
      error.validation
    ) {
      return reply
        .code(400)
        .send(
          createErrorResponse(
            "VALIDATION_ERROR",
            "The request is invalid.",
            request.id,
          ),
        );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 401
    ) {
      return reply
        .code(401)
        .send(
          createErrorResponse(
            "UNAUTHORIZED",
            "Authentication is required.",
            request.id,
          ),
        );
    }

    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2002") {
        return reply
          .code(409)
          .send(
            createErrorResponse(
              "CONFLICT",
              "A record with these values already exists.",
              request.id,
            ),
          );
      }
      if (error.code === "P2025") {
        return reply
          .code(404)
          .send(
            createErrorResponse("NOT_FOUND", "Record not found.", request.id),
          );
      }
    }

    request.log.error({ err: error }, "Unhandled request error");

    return reply
      .code(500)
      .send(
        createErrorResponse(
          "INTERNAL_ERROR",
          "An unexpected error occurred.",
          request.id,
        ),
      );
  });
}
