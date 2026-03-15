import {sanitizeString} from '@shared/sanitizers/sanitize-string';

/**
 * Recursively sanitizes an unknown value.
 * - Strings are sanitized via {@link sanitizeString}
 * - Arrays are sanitized element by element
 * - Plain objects are sanitized key by key
 * - Class instances and all other primitives are returned as-is
 * @param value - The value to sanitize.
 * @returns The sanitized value with the same structure.
 */
export function sanitizeAny(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeString(value);

  if (Array.isArray(value)) {
    return value.map(v => sanitizeAny(v));
  }

  if (value && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value) as object;
    const isPlainObject = proto === Object.prototype || proto === null;

    // Skip class instances (e.g. Date) — only sanitize plain objects
    if (!isPlainObject) return value;

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeAny(v);
    }
    return out;
  }

  return value;
}