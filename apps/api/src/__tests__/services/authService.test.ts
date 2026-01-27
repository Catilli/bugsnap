import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../services/authService';
import { prisma } from '../../lib/prisma';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import bcrypt from 'bcrypt';

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';
      const hashedPassword = 'hashedPassword123';

      // Mock user doesn't exist
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      
      // Mock password hashing
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
      
      // Mock user creation
      const mockUser = {
        id: '123',
        email,
        name,
        role: 'member' as const,
        createdAt: new Date(),
      };
      vi.mocked(prisma.user.create).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        updatedAt: new Date(),
      } as any);

      const result = await authService.register(email, password, name);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: '123',
        email,
        name,
        role: 'member',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictError if email already exists', async () => {
      const email = 'existing@example.com';
      
      // Mock user exists
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '123',
        email,
        name: 'Existing User',
        password: 'hashedPassword',
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authService.register(email, 'password123', 'Test User')
      ).rejects.toThrow(ConflictError);
      
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      const mockUser = {
        id: '123',
        email,
        password: hashedPassword,
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.login(email, password);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toMatchObject({
        id: '123',
        email,
        name: 'Test User',
        role: 'member',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const userId = '123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
        updatedAt: new Date(),
      } as any);

      const result = await authService.getUserById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      expect(result).toMatchObject(mockUser);
    });

    it('should throw NotFoundError if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.getUserById('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = '123';
      const updateData = { name: 'Updated Name' };
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        role: 'member' as const,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUpdatedUser,
        password: 'hashedPassword',
        createdAt: new Date(),
      } as any);

      const result = await authService.updateProfile(userId, updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          updatedAt: true,
        },
      });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '123';
      const currentPassword = 'oldPassword';
      const newPassword = 'newPassword123';
      const oldHashedPassword = 'oldHashedPassword';
      const newHashedPassword = 'newHashedPassword';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password: oldHashedPassword,
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue(newHashedPassword as never);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser);

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, oldHashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: newHashedPassword },
      });
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw NotFoundError if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.changePassword('nonexistent', 'old', 'new')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError if current password is incorrect', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.changePassword('123', 'wrongpassword', 'newpassword')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});