import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
  icon: z.string().max(10).optional().nullable(),
});

export const getCategories = async (req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId! },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(categories);
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  const body = categorySchema.parse(req.body);
  const category = await prisma.category.create({
    data: { ...body, userId: req.userId! },
    include: { _count: { select: { tasks: true } } },
  });
  res.status(201).json(category);
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  const body = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: body,
    include: { _count: { select: { tasks: true } } },
  });
  res.json(category);
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted' });
};
