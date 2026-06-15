export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  SERVER_ERROR: "SERVER_ERROR",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;

export type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; fieldErrors?: FieldErrors<Record<string, unknown>> };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err(
  code: ErrorCode,
  fieldErrors?: FieldErrors<Record<string, unknown>>,
): Result<never> {
  return { ok: false, code, fieldErrors };
}
