import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

/**
 * Strip ALL HTML tags from user input while preserving text content.
 * Uses `recursiveEscape` so nested tags are unwrapped, not silently removed.
 */
export function sanitizeString(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  });
}

/**
 * Zod string schema that sanitizes HTML on parse.
 * Use in place of `z.string()` for user-facing text fields.
 */
export function zSanitizedString() {
  return z.string().transform(sanitizeString);
}
