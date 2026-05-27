import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const { unreadOnly } = req.query as { unreadOnly?: string };

  const notifications = await prisma.notification.findMany({
    where: {
      userId: req.userId!,
      ...(unreadOnly === 'true' ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.userId!, read: false },
  });

  res.json({ notifications, unreadCount });
};

export const markRead = async (req: AuthRequest, res: Response) => {
  const schema = z.object({ ids: z.array(z.string()).optional() });
  const { ids } = schema.parse(req.body);

  await prisma.notification.updateMany({
    where: {
      userId: req.userId!,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { read: true },
  });

  res.json({ message: 'Marked as read' });
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  await prisma.notification.deleteMany({
    where: { id: req.params.id, userId: req.userId! },
  });
  res.json({ message: 'Deleted' });
};

export const clearAll = async (req: AuthRequest, res: Response) => {
  await prisma.notification.deleteMany({
    where: { userId: req.userId!, read: true },
  });
  res.json({ message: 'Cleared read notifications' });
};
