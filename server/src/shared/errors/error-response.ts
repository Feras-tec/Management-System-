export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
): ErrorResponse {
  return {
    error: {
      code,
      message,
      requestId,
    },
  };
}
