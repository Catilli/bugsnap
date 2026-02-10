import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:'];

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
 * Validate a URL and reject dangerous protocols (javascript:, data:, vbscript:).
 * Returns the URL if safe, throws if dangerous.
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!SAFE_URL_PROTOCOLS.includes(parsed.protocol)) {
      throw new Error(`Unsafe URL protocol: ${parsed.protocol}`);
    }
    return url;
  } catch (e) {
    if (e instanceof TypeError) {
      // Invalid URL — reject
      throw new Error('Invalid URL');
    }
    throw e;
  }
}

/**
 * Zod string schema that sanitizes HTML on parse.
 * Use in place of `z.string()` for user-facing text fields.
 */
export function zSanitizedString() {
  return z.string().transform(sanitizeString);
}

/**
 * Zod string schema that validates URL protocol safety.
 * Rejects javascript:, data:, vbscript: protocols.
 */
export function zSanitizedUrl() {
  return z.string().url().transform(sanitizeUrl);
}
