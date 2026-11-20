import type { FastifyInstance, FastifyRequest } from "fastify";

import { AppError } from "../shared/errors/app-error.js";
import { createErrorResponse } from "../shared/errors/error-response.js";

// Do not log the raw URL, query, body, or headers. Request IDs and the
// registered route template are sufficient to correlate diagnostics.
export function serializeRequestForLog(request: FastifyRequest) {
  return { method: request.method, route: request.routeOptions?.url };
}

const operationalCodes = new Set([
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EPIPE", "ENOTFOUND",
  "FST_ERR_CTP_INVALID_JSON_BODY",
]);

function unexpectedErrorFields(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? error.code : undefined;
  if (typeof code === "string" && /^P\d{4}$/.test(code)) {
    return { kind: "database", code };
  }
  if (typeof code === "string" && operationalCodes.has(code)) {
    return { kind: "operational", code };
  }
  if (error instanceof TypeError) return { kind: "type-error" };
  if (error instanceof RangeError) return { kind: "range-error" };
  return { kind: "unexpected" };
}

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
      if (error.code === "FST_ERR_CTP_BODY_TOO_LARGE") {
        return reply
          .code(413)
          .send(
            createErrorResponse(
              "PAYLOAD_TOO_LARGE",
              "The request body is too large.",
              request.id,
            ),
          );
      }
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

    request.log.error({
      route: request.routeOptions.url,
      method: request.method,
      failure: unexpectedErrorFields(error),
    }, "Unhandled request error");

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
