import type { ApiErrorBody, ErrorCode, FieldErrors } from '@padosipro/shared';

export type { ErrorCode, FieldErrors };

/** Thrown anywhere in the API; the error handler turns it into the shared ApiErrorBody shape. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly options: { fields?: FieldErrors; details?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
  }

  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.options.fields ? { fields: this.options.fields } : {}),
        ...(this.options.details ? { details: this.options.details } : {}),
      },
    };
  }
}

export const validationError = (fields: FieldErrors, message = 'Please fix the highlighted fields.') =>
  new AppError(400, 'VALIDATION_ERROR', message, { fields });

export const unauthorized = (message = 'Your session has expired. Please log in again.') =>
  new AppError(401, 'UNAUTHORIZED', message);
