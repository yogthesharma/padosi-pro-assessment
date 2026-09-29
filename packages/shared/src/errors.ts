/**
 * Every error the API returns has the shape:
 *   { "error": { "code": "SOME_CODE", "message": "Human readable", "fields"?: {...}, "details"?: {...} } }
 * `code` is stable and meant for the client to branch on; `message` is safe to show to users.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'EMAIL_ALREADY_VERIFIED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_NOT_FOUND'
  | 'OTP_TOO_MANY_ATTEMPTS'
  | 'OTP_RESEND_TOO_SOON'
  | 'OTP_SEND_LIMIT_REACHED'
  | 'MAIL_DELIVERY_FAILED'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export type FieldErrors = Record<string, string>;

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    fields?: FieldErrors;
    details?: Record<string, unknown>;
  };
}
