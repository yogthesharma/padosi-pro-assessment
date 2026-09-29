import type { z } from 'zod';
import { validationError, type FieldErrors } from './errors.js';

/** Parses untrusted input with a zod schema, turning failures into a 400 with one message per field. */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input ?? {});
  if (result.success) return result.data;

  const fields: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_root';
    fields[key] ??= issue.message;
  }
  throw validationError(fields);
}
