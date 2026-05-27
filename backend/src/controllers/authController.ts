import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional().default(false),
});

export const signup = async (req: Request, res: Response) => {
  const body = signupSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      settings: {
        create: {}, // default settings
      },
      // create default categories
      categories: {
        createMany: {
          data: [
            { name: 'Work', color: '#6366f1', icon: '💼' },
            { name: 'Personal', color: '#10b981', icon: '🏠' },
            { name: 'Health', color: '#ef4444', icon: '❤️' },
            { name: 'Learning', color: '#f59e0b', icon: '📚' },
          ],
        },
      },
    },
    select: { id: true, name: true, email: true, avatar: true, timezone: true },
  });

  const token = signToken(user.id);
  res.status(201).json({ user, token });
};

export const login = async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(body.password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user.id, body.rememberMe);
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, token });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true, name: true, email: true, avatar: true,
      timezone: true, createdAt: true,
      settings: true,
    },
  });
  res.json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).max(100).optional(),
    avatar: z.string().url().optional().nullable(),
    timezone: z.string().optional(),
  });
  const body = schema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: body,
    select: { id: true, name: true, email: true, avatar: true, timezone: true },
  });
  res.json(user);
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    soundEnabled: z.boolean().optional(),
    browserNotifications: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    reminderLeadMinutes: z.number().min(0).max(60).optional(),
    weekStartsOn: z.number().min(0).max(1).optional(),
    defaultPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    pomodoroWorkMinutes: z.number().min(1).max(90).optional(),
    pomodoroBreakMinutes: z.number().min(1).max(30).optional(),
  });
  const body = schema.parse(req.body);

  const settings = await prisma.userSettings.upsert({
    where: { userId: req.userId! },
    update: body,
    create: { userId: req.userId!, ...body },
  });
  res.json(settings);
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
  });
  const body = schema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  const valid = await bcrypt.compare(body.currentPassword, user!.password);
  if (!valid) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const hashed = await bcrypt.hash(body.newPassword, 12);
  await prisma.user.update({
    where: { id: req.userId! },
    data: { password: hashed },
  });
  res.json({ message: 'Password updated successfully' });
};
