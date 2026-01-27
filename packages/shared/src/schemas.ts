import { z } from 'zod';

export const environmentDataSchema = z.object({
  browser: z.string(),
  browserVersion: z.string(),
  os: z.string(),
  screenResolution: z.string(),
  viewportSize: z.string(),
  url: z.string().url(),
  pageTitle: z.string(),
  userAgent: z.string(),
  timestamp: z.string(),
  timezone: z.string(),
  consoleErrors: z.array(z.string()).optional(),
  networkRequests: z.array(z.string()).optional(),
});

export const createBugReportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  url: z.string().url(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  teamId: z.string().uuid(),
  environmentData: environmentDataSchema,
});

export const updateBugReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});