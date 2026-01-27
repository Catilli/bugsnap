import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Setup test database connection
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup and disconnect
  await prisma.$disconnect();
  console.log('Test environment cleaned up');
});

beforeEach(async () => {
  // Clean database before each test
  // You may want to add transaction support for faster tests
});

afterEach(async () => {
  // Cleanup after each test if needed
});