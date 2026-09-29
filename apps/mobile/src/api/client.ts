import type { ApiErrorBody, ErrorCode, FieldErrors } from '@padosipro/shared';
import { getApiUrl } from '@/config/api-url';

export type ClientErrorCode = ErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNEXPECTED_RESPONSE';

/** Every failed request becomes an ApiError, whether the server answered or not. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ClientErrorCode,
    message: string,
    public readonly fields: FieldErrors = {},
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export function errorMessage(error: unknown) {
  return isApiError(error) ? error.message : 'Something went wrong. Please try again.';
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** Called when the server rejects our token, so the session can end cleanly. */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

const TIMEOUT_MS = 15_000;

export async function request<T>(
  path: string,
  { method = 'GET', body, baseUrl }: { method?: 'GET' | 'POST' | 'PUT'; body?: unknown; baseUrl?: string } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl ?? getApiUrl()}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError(0, 'TIMEOUT', 'The server took too long to respond. Please try again.');
    }
    throw new ApiError(0, 'NETWORK_ERROR', "Can't reach PadosiPro. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload as ApiErrorBody | null)?.error;
    if (response.status === 401 && authToken) onUnauthorized?.();
    if (!error) {
      throw new ApiError(response.status, 'UNEXPECTED_RESPONSE', 'Something went wrong on our side. Please try again.');
    }
    throw new ApiError(response.status, error.code, error.message, error.fields, error.details);
  }

  return payload as T;
}
