import { prisma } from '../lib/prisma';
import { enqueue, emailQueue } from '../lib/queue';
import { sanitizeString } from '../utils/sanitize';

export const notificationService = {
  async create(params: {
    userId: string;
    type: string;
    title: string;
    message?: string;
    issueId?: string;
    projectId?: string;
    feedbackId?: string;
  }) {
    const notification = await prisma.notification.create({
      data: params,
    });

    // Queue email notification (non-blocking, no-op if Redis unavailable)
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      enqueue(emailQueue, 'notification-email', {
        to: user.email,
        subject: params.title,
        html: `<p>Hi ${sanitizeString(user.name || '')},</p><p>${sanitizeString(params.message || params.title)}</p><p>— BugSnap</p>`,
      });
    }

    return notification;
  },

  async getForUser(userId: string, unreadOnly?: boolean, category?: 'issue' | 'feedback') {
    const categoryFilter = category === 'issue'
      ? { feedbackId: null }
      : category === 'feedback'
        ? { feedbackId: { not: null } }
        : {};

    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
        ...categoryFilter,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        issue: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
        feedback: { select: { id: true, title: true } },
      },
    });
  },

  async markRead(id: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  },

  async markAllRead(userId: string, category?: 'issue' | 'feedback') {
    const categoryFilter = category === 'issue'
      ? { feedbackId: null }
      : category === 'feedback'
        ? { feedbackId: { not: null } }
        : {};

    await prisma.notification.updateMany({
      where: { userId, read: false, ...categoryFilter },
      data: { read: true },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },
};
