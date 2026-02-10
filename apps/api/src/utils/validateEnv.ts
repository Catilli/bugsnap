const WEAK_SECRETS = [
  'your-secret-key-change-this-in-production',
  'change-me',
  'secret',
  'jwt-secret',
  'password',
];

export function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Existence check
  if (!secret) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    process.exit(1);
    return '' as never;
  }

  // 2. Known weak secrets (reject always in production, warn in dev)
  if (WEAK_SECRETS.includes(secret.toLowerCase())) {
    if (isProduction) {
      console.error('FATAL: JWT_SECRET is a known weak default. Set a strong, unique secret.');
      process.exit(1);
    }
    console.warn('WARNING: JWT_SECRET is a known weak default. Change it before deploying to production.');
  }

  // 3. Minimum length (32 chars)
  if (secret.length < 32) {
    if (isProduction) {
      console.error('FATAL: JWT_SECRET must be at least 32 characters long.');
      process.exit(1);
    }
    console.warn(`WARNING: JWT_SECRET is only ${secret.length} chars. Use at least 32 characters for production.`);
  }

  return secret;
}
