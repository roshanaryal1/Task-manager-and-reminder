import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

const reminderSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().optional().nullable(),
  remindAt: z.string().datetime(),
  taskId: z.string().optional().nullable(),
});

export const getReminders = async (req: AuthRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  const reminders = await prisma.reminder.findMany({
    where: {
      userId: req.userId!,
      ...(status ? { status: status as 'PENDING' | 'TRIGGERED' | 'SNOOZED' | 'DISMISSED' } : {}),
    },
    include: { task: { select: { id: true, title: true, priority: true } } },
    orderBy: { remindAt: 'asc' },
  });
  res.json(reminders);
};

export const createReminder = async (req: AuthRequest, res: Response) => {
  const body = reminderSchema.parse(req.body);

  const reminder = await prisma.reminder.create({
    data: {
      ...body,
      userId: req.userId!,
      remindAt: new Date(body.remindAt),
    },
    include: { task: { select: { id: true, title: true, priority: true } } },
  });

  res.status(201).json(reminder);
};

export const updateReminder = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: 'Reminder not found' });

  const body = reminderSchema.partial().parse(req.body);
  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: {
      ...body,
      remindAt: body.remindAt ? new Date(body.remindAt) : undefined,
    },
    include: { task: { select: { id: true, title: true, priority: true } } },
  });

  res.json(reminder);
};

export const deleteReminder = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: 'Reminder not found' });

  await prisma.reminder.delete({ where: { id: req.params.id } });
  res.json({ message: 'Reminder deleted' });
};

export const snoozeReminder = async (req: AuthRequest, res: Response) => {
  const schema = z.object({ minutes: z.number().min(1).max(1440).default(10) });
  const { minutes } = schema.parse(req.body);

  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: 'Reminder not found' });

  const snoozedTo = new Date(Date.now() + minutes * 60 * 1000);
  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: { status: 'SNOOZED', snoozedTo, remindAt: snoozedTo },
  });

  res.json(reminder);
};

export const dismissReminder = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: 'Reminder not found' });

  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: { status: 'DISMISSED', dismissedAt: new Date() },
  });

  res.json(reminder);
};

// Returns reminders due in the next poll window — used by frontend polling
export const getPendingReminders = async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: {
      userId: req.userId!,
      status: { in: ['PENDING', 'SNOOZED'] },
      remindAt: { lte: now },
    },
    include: { task: { select: { id: true, title: true, priority: true } } },
  });

  // Mark them as triggered
  if (reminders.length > 0) {
    await prisma.reminder.updateMany({
      where: { id: { in: reminders.map(r => r.id) } },
      data: { status: 'TRIGGERED', triggeredAt: now },
    });
  }

  res.json(reminders);
};
