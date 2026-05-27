import { Response } from 'express';
import { z } from 'zod';
import webpush from 'web-push';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

// Configure VAPID keys — generate with: npx web-push generate-vapid-keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@taskmanager.app'}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const getVapidKey = (_req: AuthRequest, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

export const subscribe = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  });
  const sub = schema.parse(req.body);

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: {
      userId: req.userId!,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });

  res.status(201).json({ message: 'Subscribed to push notifications' });
};

export const unsubscribe = async (req: AuthRequest, res: Response) => {
  const { endpoint } = req.body as { endpoint: string };
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: req.userId! },
  });
  res.json({ message: 'Unsubscribed' });
};

export const sendPushToUser = async (userId: string, payload: object) => {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(err => {
        // Remove expired subscriptions (410 Gone)
        if (err.statusCode === 410) {
          return prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
        }
      })
    )
  );
};
