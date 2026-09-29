import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isApiError } from '@/api/client';

/**
 * Puts server-side field errors under the matching inputs. Returns true if any were applied,
 * so the caller only shows a banner for errors that don't belong to a field.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly Path<T>[],
): boolean {
  if (!isApiError(error)) return false;
  let applied = false;
  for (const [field, message] of Object.entries(error.fields)) {
    if ((knownFields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
