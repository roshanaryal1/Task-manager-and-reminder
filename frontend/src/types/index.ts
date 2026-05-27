export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type RecurringType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ReminderStatus = 'PENDING' | 'TRIGGERED' | 'SNOOZED' | 'DISMISSED';
export type NotificationType = 'REMINDER' | 'TASK_DUE' | 'TASK_OVERDUE' | 'SYSTEM';
export type Theme = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  timezone: string;
  createdAt: string;
  settings?: UserSettings;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: Theme;
  soundEnabled: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
  reminderLeadMinutes: number;
  weekStartsOn: 0 | 1;
  defaultPriority: Priority;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  userId: string;
  categoryId?: string | null;
  category?: Category | null;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string | null;
  dueTime?: string | null;
  completedAt?: string | null;
  position: number;
  tags: string[];
  recurring?: RecurringType | null;
  recurringEnd?: string | null;
  reminders?: Reminder[];
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  taskId?: string | null;
  task?: Pick<Task, 'id' | 'title' | 'priority'> | null;
  title: string;
  message?: string | null;
  remindAt: string;
  snoozedTo?: string | null;
  status: ReminderStatus;
  triggeredAt?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  inProgress: number;
  thisWeekCompleted: number;
  completionRate: number;
  priorityBreakdown: { priority: Priority; count: number }[];
  categoryBreakdown: { categoryId?: string; name?: string; color?: string; count: number }[];
}

export interface WeeklyProgress {
  date: string;
  completed: number;
  created: number;
}

export interface ProductivityScore {
  score: number;
  tasksCompleted: number;
  tasksCreated: number;
  overdueCount: number;
  onTimeCount: number;
  completionRate: number;
  period: string;
}

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}
