import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (role defaults to MANAGER from schema)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // OAuth-only users cannot login with password
    if (!user.password) {
      throw new UnauthorizedError('This account uses social login. Please sign in with Google or GitHub.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Return user without password
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // OAuth-only users cannot change password
    if (!user.password) {
      throw new UnauthorizedError('This account uses social login and has no password to update.');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Find or create user from OAuth provider data
   */
  async findOrCreateOAuthUser(provider: string, oauthId: string, email: string, name: string) {
    // First check if user exists by OAuth provider + ID
    let user = await prisma.user.findFirst({
      where: { oauthProvider: provider, oauthId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (user) return user;

    // Check if user exists by email (link accounts)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Link OAuth to existing account
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { oauthProvider: provider, oauthId },
        select: { id: true, email: true, name: true, role: true },
      });
      return user;
    }

    // Create new OAuth user (no password)
    user = await prisma.user.create({
      data: {
        email,
        name,
        oauthProvider: provider,
        oauthId,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return user;
  }
}

export const authService = new AuthService();