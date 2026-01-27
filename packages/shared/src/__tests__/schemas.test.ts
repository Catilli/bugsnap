import { describe, it, expect } from 'vitest';
import {
  environmentDataSchema,
  createBugReportSchema,
  updateBugReportSchema,
  createCommentSchema,
  registerSchema,
  loginSchema,
  createTeamSchema,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('environmentDataSchema', () => {
    it('should validate correct environment data', () => {
      const validData = {
        browser: 'Chrome',
        browserVersion: '120.0.0',
        os: 'Windows 11',
        screenResolution: '1920x1080',
        viewportSize: '1366x768',
        url: 'https://example.com/page',
        pageTitle: 'Test Page',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Manila',
      };

      const result = environmentDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with optional fields', () => {
      const validData = {
        browser: 'Chrome',
        browserVersion: '120.0.0',
        os: 'Windows 11',
        screenResolution: '1920x1080',
        viewportSize: '1366x768',
        url: 'https://example.com/page',
        pageTitle: 'Test Page',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Manila',
        consoleErrors: ['Error 1', 'Error 2'],
        networkRequests: ['GET /api/users', 'POST /api/data'],
      };

      const result = environmentDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid URL', () => {
      const invalidData = {
        browser: 'Chrome',
        browserVersion: '120.0.0',
        os: 'Windows 11',
        screenResolution: '1920x1080',
        viewportSize: '1366x768',
        url: 'not-a-valid-url',
        pageTitle: 'Test Page',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Manila',
      };

      const result = environmentDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createBugReportSchema', () => {
    it('should validate correct bug report data', () => {
      const validData = {
        title: 'Button not working',
        description: 'The submit button does not respond to clicks',
        url: 'https://example.com/form',
        priority: 'high',
        teamId: '123e4567-e89b-12d3-a456-426614174000',
        environmentData: {
          browser: 'Chrome',
          browserVersion: '120.0.0',
          os: 'Windows 11',
          screenResolution: '1920x1080',
          viewportSize: '1366x768',
          url: 'https://example.com/form',
          pageTitle: 'Form Page',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date().toISOString(),
          timezone: 'Asia/Manila',
        },
      };

      const result = createBugReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with title too short', () => {
      const invalidData = {
        title: '',
        description: 'The submit button does not respond to clicks',
        url: 'https://example.com/form',
        priority: 'high',
        teamId: '123e4567-e89b-12d3-a456-426614174000',
        environmentData: {
          browser: 'Chrome',
          browserVersion: '120.0.0',
          os: 'Windows 11',
          screenResolution: '1920x1080',
          viewportSize: '1366x768',
          url: 'https://example.com/form',
          pageTitle: 'Form Page',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date().toISOString(),
          timezone: 'Asia/Manila',
        },
      };

      const result = createBugReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid priority', () => {
      const invalidData = {
        title: 'Button not working',
        description: 'The submit button does not respond to clicks',
        url: 'https://example.com/form',
        priority: 'invalid-priority',
        teamId: '123e4567-e89b-12d3-a456-426614174000',
        environmentData: {
          browser: 'Chrome',
          browserVersion: '120.0.0',
          os: 'Windows 11',
          screenResolution: '1920x1080',
          viewportSize: '1366x768',
          url: 'https://example.com/form',
          pageTitle: 'Form Page',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date().toISOString(),
          timezone: 'Asia/Manila',
       },
      };

      const result = createBugReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateBugReportSchema', () => {
    it('should validate with all fields', () => {
      const validData = {
        title: 'Updated title',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'critical',
      };

      const result = updateBugReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with partial fields', () => {
      const validData = {
        status: 'resolved',
      };

      const result = updateBugReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid status', () => {
      const invalidData = {
        status: 'invalid-status',
      };

      const result = updateBugReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createCommentSchema', () => {
    it('should validate correct comment', () => {
      const validData = {
        content: 'This is a test comment',
      };

      const result = createCommentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with empty content', () => {
      const invalidData = {
        content: '',
      };

      const result = createCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with content too long', () => {
      const invalidData = {
        content: 'a'.repeat(2001),
      };

      const result = createCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'securePassword123',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with empty name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: '',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createTeamSchema', () => {
    it('should validate correct team data', () => {
      const validData = {
        name: 'Development Team',
        slug: 'dev-team',
      };

      const result = createTeamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid slug', () => {
      const invalidData = {
        name: 'Development Team',
        slug: 'Dev Team!',
      };

      const result = createTeamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail with empty name', () => {
      const invalidData = {
        name: '',
        slug: 'dev-team',
      };

      const result = createTeamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
