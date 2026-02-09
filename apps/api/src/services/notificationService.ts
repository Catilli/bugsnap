import { prisma } from '../lib/prisma';
import { enqueue, emailQueue } from '../lib/queue';

export const notificationService = {
  async create(params: {
    userId: string;
    type: string;
    title: string;
    message?: string;
    issueId?: string;
    projectId?: string;
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
        html: `<p>Hi ${user.name},</p><p>${params.message || params.title}</p><p>— BugSnap</p>`,
      });
    }

    return notification;
  },

  async getForUser(userId: string, unreadOnly?: boolean) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        issue: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });
  },

  async markRead(id: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },
};
