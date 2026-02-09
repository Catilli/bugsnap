import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function logActivity(params: {
  projectId?: string;
  issueId?: string;
  feedbackId?: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.activityLog.create({ data: params });
  } catch (error) {
    // Activity logging should never break the main request
    console.error('[activityLogger] Failed to log activity:', error);
  }
}
