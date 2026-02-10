import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateJwtSecret } from '../utils/validateEnv';

describe('validateJwtSecret', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('exits if JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    validateJwtSecret();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      'FATAL: JWT_SECRET environment variable is required',
    );
  });

  it('exits in production with a known weak secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'your-secret-key-change-this-in-production';
    validateJwtSecret();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      'FATAL: JWT_SECRET is a known weak default. Set a strong, unique secret.',
    );
  });

  it('exits in production with a short secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short-but-not-weak-name';
    validateJwtSecret();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      'FATAL: JWT_SECRET must be at least 32 characters long.',
    );
  });

  it('warns in development with a known weak secret', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'secret';
    validateJwtSecret();
    expect(process.exit).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'WARNING: JWT_SECRET is a known weak default. Change it before deploying to production.',
    );
  });

  it('warns in development with a short secret', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'short-dev-secret';
    validateJwtSecret();
    expect(process.exit).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: JWT_SECRET is only'),
    );
  });

  it('returns the secret when valid and strong', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-very-strong-secret-that-is-at-least-32-chars-long!';
    const result = validateJwtSecret();
    expect(result).toBe('a-very-strong-secret-that-is-at-least-32-chars-long!');
    expect(process.exit).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('is case-insensitive when checking weak secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'PASSWORD';
    validateJwtSecret();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
