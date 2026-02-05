import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  transpilePackages: ['@bugsnap/shared'],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // Disable source map upload until SENTRY_AUTH_TOKEN is configured
  sourcemaps: {
    disable: true,
  },
});
