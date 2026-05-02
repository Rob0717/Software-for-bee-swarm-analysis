/**
 * Sanitizes a string by normalizing Unicode, removing combining diacritical marks
 * (used in Zalgo text attacks), collapsing multiple whitespace characters into one,
 * and trimming leading and trailing whitespace.
 * @param input - The raw string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeString(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[\p{Mn}\p{Me}]/gu, '')  // remove combining marks (prevents Zalgo text)
    .replace(/\s+/g, ' ')             // collapse multiple whitespace characters into a single space
    .trim();
}