import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeUrl, zSanitizedUrl } from '../utils/sanitize';

describe('sanitizeString', () => {
  it('neutralizes <script> tags (HTML-escapes them)', () => {
    const result = sanitizeString('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
  });

  it('neutralizes nested script tags', () => {
    const result = sanitizeString('<div><script>alert(1)</script></div>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<div>');
  });

  it('strips onerror attributes', () => {
    const input = '<img onerror="alert(1)" src="x">';
    const result = sanitizeString(input);
    expect(result).not.toContain('onerror');
  });

  it('strips onclick attributes', () => {
    const input = '<div onclick="alert(1)">text</div>';
    const result = sanitizeString(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('text');
  });

  it('preserves plain text content', () => {
    expect(sanitizeString('Hello World')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('accepts http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('accepts https URLs', () => {
    expect(sanitizeUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });

  it('accepts mailto URLs', () => {
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
  });

  it('rejects javascript: URLs', () => {
    expect(() => sanitizeUrl('javascript:alert(1)')).toThrow();
  });

  it('rejects data: URLs', () => {
    expect(() => sanitizeUrl('data:text/html,<script>alert(1)</script>')).toThrow();
  });

  it('rejects vbscript: URLs', () => {
    expect(() => sanitizeUrl('vbscript:MsgBox("XSS")')).toThrow();
  });

  it('rejects invalid URLs', () => {
    expect(() => sanitizeUrl('not a url')).toThrow();
  });
});

describe('zSanitizedUrl', () => {
  it('passes valid https URL', () => {
    const schema = zSanitizedUrl();
    expect(schema.parse('https://example.com')).toBe('https://example.com');
  });

  it('rejects javascript: URL', () => {
    const schema = zSanitizedUrl();
    expect(() => schema.parse('javascript:alert(1)')).toThrow();
  });

  it('rejects non-URL strings', () => {
    const schema = zSanitizedUrl();
    expect(() => schema.parse('not-a-url')).toThrow();
  });
});
