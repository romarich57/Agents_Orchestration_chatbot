import "server-only";

export type ApplicationErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "CONFIGURATION_ERROR"
  | "UPSTREAM_ERROR"
  | "UPSTREAM_EMPTY_RESPONSE"
  | "INTERNAL_ERROR";

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(params: {
    message: string;
    code: ApplicationErrorCode;
    httpStatus: number;
    details?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = "ApplicationError";
    this.code = params.code;
    this.httpStatus = params.httpStatus;
    this.details = params.details;
  }
}
