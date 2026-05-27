import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [total, completed, pending, overdue, inProgress, thisWeekCompleted] = await Promise.all([
    prisma.task.count({ where: { userId, parentId: null } }),
    prisma.task.count({ where: { userId, status: 'COMPLETED', parentId: null } }),
    prisma.task.count({ where: { userId, status: 'PENDING', parentId: null } }),
    prisma.task.count({
      where: {
        userId, parentId: null,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
    }),
    prisma.task.count({ where: { userId, status: 'IN_PROGRESS', parentId: null } }),
    prisma.task.count({
      where: { userId, status: 'COMPLETED', completedAt: { gte: startOfWeek } },
    }),
  ]);

  // Priority breakdown
  const priorityBreakdown = await prisma.task.groupBy({
    by: ['priority'],
    where: { userId, status: { not: 'COMPLETED' }, parentId: null },
    _count: { id: true },
  });

  // Category breakdown
  const categoryBreakdown = await prisma.task.groupBy({
    by: ['categoryId'],
    where: { userId, parentId: null },
    _count: { id: true },
  });

  const categoryIds = categoryBreakdown
    .filter(c => c.categoryId)
    .map(c => c.categoryId!);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });

  const categoryData = categoryBreakdown.map(c => ({
    categoryId: c.categoryId,
    count: c._count.id,
    ...categories.find(cat => cat.id === c.categoryId),
  }));

  res.json({
    total,
    completed,
    pending,
    overdue,
    inProgress,
    thisWeekCompleted,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    priorityBreakdown: priorityBreakdown.map(p => ({
      priority: p.priority,
      count: p._count.id,
    })),
    categoryBreakdown: categoryData,
  });
};

export const getWeeklyProgress = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const days: { date: string; completed: number; created: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const start = new Date(day.setHours(0, 0, 0, 0));
    const end = new Date(day.setHours(23, 59, 59, 999));

    const [completed, created] = await Promise.all([
      prisma.task.count({
        where: { userId, completedAt: { gte: start, lte: end } },
      }),
      prisma.task.count({
        where: { userId, createdAt: { gte: start, lte: end }, parentId: null },
      }),
    ]);

    days.push({
      date: start.toISOString().split('T')[0],
      completed,
      created,
    });
  }

  res.json(days);
};

export const getProductivityScore = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [tasksCompleted, tasksCreated, overdueCount, onTimeCount] = await Promise.all([
    prisma.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } } }),
    prisma.task.count({ where: { userId, createdAt: { gte: thirtyDaysAgo }, parentId: null } }),
    prisma.task.count({
      where: {
        userId, status: 'COMPLETED',
        completedAt: { gte: thirtyDaysAgo },
        dueDate: { not: null },
        // completed after due date = overdue completion
      },
    }),
    prisma.task.count({
      where: {
        userId, status: 'COMPLETED',
        completedAt: { gte: thirtyDaysAgo },
        dueDate: { not: null },
      },
    }),
  ]);

  const completionRate = tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
  const score = Math.min(100, Math.round(completionRate * 0.7 + Math.min(tasksCompleted * 2, 30)));

  res.json({
    score,
    tasksCompleted,
    tasksCreated,
    overdueCount,
    onTimeCount,
    completionRate: Math.round(completionRate),
    period: '30 days',
  });
};
