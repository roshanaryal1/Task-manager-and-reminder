import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Bell } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { useReminderStore } from '../../stores/reminderStore';
import { taskService } from '../../services/taskService';
import { Task } from '../../types';
import api from '../../services/api';
import { Category } from '../../types';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  categoryId: z.string().optional().nullable(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  recurring: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', '']).optional(),
  reminderAt: z.string().optional(), // ISO datetime for inline reminder
});

type FormData = z.infer<typeof schema>;

export default function TaskModal() {
  const { taskModalId, closeTaskModal } = useUIStore();
  const { createTask, updateTask } = useTaskStore();
  const { createReminder } = useReminderStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!taskModalId;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', status: 'PENDING' },
  });

  useEffect(() => {
    api.get<Category[]>('/categories').then(r => setCategories(r.data));

    if (isEdit) {
      setLoading(true);
      taskService.getById(taskModalId!).then(t => {
        setTask(t);
        reset({
          title: t.title,
          description: t.description ?? '',
          priority: t.priority,
          status: t.status,
          categoryId: t.categoryId ?? '',
          dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
          dueTime: t.dueTime ?? '',
          tags: t.tags.join(', '),
          recurring: t.recurring ?? '',
        });
        setLoading(false);
      });
    }
  }, [taskModalId, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        categoryId: data.categoryId || null,
        dueDate: data.dueDate ? new Date(`${data.dueDate}T00:00:00`).toISOString() : null,
        dueTime: data.dueTime || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        recurring: (data.recurring as 'DAILY' | 'WEEKLY' | 'MONTHLY' | undefined) || null,
      };

      let savedTask: Task;
      if (isEdit) {
        await updateTask(taskModalId!, payload);
        savedTask = task!;
      } else {
        savedTask = await createTask(payload);
      }

      // Create reminder if set
      if (data.reminderAt && savedTask) {
        await createReminder({
          title: `Reminder: ${data.title}`,
          remindAt: new Date(data.reminderAt).toISOString(),
          taskId: savedTask.id,
        });
      }

      closeTaskModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) closeTaskModal(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-elevated overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">
              {isEdit ? 'Edit Task' : 'New Task'}
            </h2>
            <button onClick={closeTaskModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Title */}
              <div>
                <input
                  {...register('title')}
                  placeholder="Task title..."
                  className="input text-base font-medium"
                  autoFocus
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              {/* Description */}
              <textarea
                {...register('description')}
                placeholder="Add description (optional)..."
                rows={3}
                className="input resize-none"
              />

              {/* Priority + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Priority</label>
                  <select {...register('priority')} className="input">
                    <option value="LOW">🟢 Low</option>
                    <option value="MEDIUM">🔵 Medium</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="URGENT">🔴 Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select {...register('status')} className="input">
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Category + Recurring */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select {...register('categoryId')} className="input">
                    <option value="">No category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Recurring</label>
                  <select {...register('recurring')} className="input">
                    <option value="">Not recurring</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Due date + time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Due date</label>
                  <input {...register('dueDate')} type="date" className="input" />
                </div>
                <div>
                  <label className="label">Due time</label>
                  <input {...register('dueTime')} type="time" className="input" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input {...register('tags')} placeholder="design, frontend, bug..." className="input" />
              </div>

              {/* Reminder */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Set Reminder</label>
                </div>
                <input
                  {...register('reminderAt')}
                  type="datetime-local"
                  className="input bg-white dark:bg-slate-900"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeTaskModal} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
