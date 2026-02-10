import { describe, it, expect } from 'vitest';
import { isSafeUrl, safeHref } from '../safeUrl';

describe('isSafeUrl', () => {
  it('accepts http URLs', () => {
    expect(isSafeUrl('http://example.com')).toBe(true);
  });

  it('accepts https URLs', () => {
    expect(isSafeUrl('https://example.com/path')).toBe(true);
  });

  it('accepts mailto URLs', () => {
    expect(isSafeUrl('mailto:user@example.com')).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects vbscript: URLs', () => {
    expect(isSafeUrl('vbscript:MsgBox("XSS")')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isSafeUrl('not a url')).toBe(false);
  });
});

describe('safeHref', () => {
  it('returns undefined for null', () => {
    expect(safeHref(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(safeHref(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(safeHref('')).toBeUndefined();
  });

  it('returns the URL for safe https URLs', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com');
  });

  it('returns undefined for javascript: URLs', () => {
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
  });

  it('returns undefined for data: URLs', () => {
    expect(safeHref('data:text/html,<h1>hi</h1>')).toBeUndefined();
  });
});
