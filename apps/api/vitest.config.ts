import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/index.ts'],
    },
    env: {
      CLERK_SECRET_KEY: 'sk_test_vitest',
      NODE_ENV: 'test',
    },
  },
});
