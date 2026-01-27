import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalError,
} from '../../utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError(400, 'TEST_ERROR', 'Test error message', { field: 'test' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('AppError');
    });

    it('should create error without details', () => {
      const error = new AppError(500, 'SERVER_ERROR', 'Internal error');
      
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });

    it('should include details when provided', () => {
      const details = { email: 'Invalid email format' };
      const error = new ValidationError('Validation failed', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Authentication required');
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Invalid token');
      
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Insufficient permissions');
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create forbidden error with custom message', () => {
      const error = new ForbiddenError('You cannot access this resource');
      
      expect(error.message).toBe('You cannot access this resource');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('User');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
      expect(error.name).toBe('NotFoundError');
    });

    it('should work with different resource types', () => {
      const bugReportError = new NotFoundError('Bug report');
      const teamError = new NotFoundError('Team');
      
      expect(bugReportError.message).toBe('Bug report not found');
      expect(teamError.message).toBe('Team not found');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Email already exists');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Email already exists');
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('InternalError', () => {
    it('should create internal error with default message', () => {
      const error = new InternalError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Internal server error');
      expect(error.name).toBe('InternalError');
    });

    it('should create internal error with custom message', () => {
      const error = new InternalError('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
    });
  });
});
