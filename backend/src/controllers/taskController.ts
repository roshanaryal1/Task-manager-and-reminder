import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

const taskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  dueDate: z.string().datetime().optional().nullable(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  recurring: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional().nullable(),
  recurringEnd: z.string().datetime().optional().nullable(),
  position: z.number().int().optional(),
});

export const getTasks = async (req: AuthRequest, res: Response) => {
  const { status, priority, categoryId, search, page = '1', limit = '50' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { userId: req.userId!, parentId: null };

  if (status) where['status'] = status;
  if (priority) where['priority'] = priority;
  if (categoryId) where['categoryId'] = categoryId;
  if (search) where['OR'] = [
    { title: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
  ];

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { category: true, reminders: { where: { status: { in: ['PENDING', 'SNOOZED'] } } } },
      orderBy: [{ position: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.task.count({ where }),
  ]);

  res.json({ tasks, total, page: parseInt(page), limit: parseInt(limit) });
};

export const getTask = async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: { category: true, reminders: true },
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const body = taskSchema.parse(req.body);

  // Get max position to add at end
  const maxPos = await prisma.task.aggregate({
    where: { userId: req.userId! },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      ...body,
      userId: req.userId!,
      position: (maxPos._max.position ?? -1) + 1,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      recurringEnd: body.recurringEnd ? new Date(body.recurringEnd) : null,
    },
    include: { category: true, reminders: true },
  });

  // Auto-create a notification for task creation
  await prisma.notification.create({
    data: {
      userId: req.userId!,
      type: 'SYSTEM',
      title: 'Task created',
      message: `"${task.title}" has been added.`,
    },
  });

  res.status(201).json(task);
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const body = taskSchema.partial().parse(req.body);

  // Track when task is completed
  let completedAt = existing.completedAt;
  if (body.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
    completedAt = new Date();
  } else if (body.status && body.status !== 'COMPLETED') {
    completedAt = null;
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...body,
      completedAt,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      recurringEnd: body.recurringEnd !== undefined ? (body.recurringEnd ? new Date(body.recurringEnd) : null) : undefined,
    },
    include: { category: true, reminders: true },
  });

  res.json(task);
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: 'Task deleted' });
};

export const reorderTasks = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    tasks: z.array(z.object({ id: z.string(), position: z.number() })),
  });
  const { tasks } = schema.parse(req.body);

  // Batch update positions
  await Promise.all(
    tasks.map(t =>
      prisma.task.updateMany({
        where: { id: t.id, userId: req.userId! },
        data: { position: t.position },
      })
    )
  );

  res.json({ message: 'Reordered successfully' });
};

export const bulkUpdateTasks = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    ids: z.array(z.string()),
    data: z.object({
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      categoryId: z.string().nullable().optional(),
    }),
  });
  const { ids, data } = schema.parse(req.body);

  await prisma.task.updateMany({
    where: { id: { in: ids }, userId: req.userId! },
    data: {
      ...data,
      completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
    },
  });

  res.json({ updated: ids.length });
};
