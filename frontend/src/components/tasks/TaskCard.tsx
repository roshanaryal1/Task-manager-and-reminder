import { motion } from 'framer-motion';
import { format, isPast } from 'date-fns';
import {
  CheckCircle2, Circle, AlertCircle, Tag,
  Bell, MoreHorizontal, Edit2, Trash2, Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { Task } from '../../types';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', class: 'priority-low' },
  MEDIUM: { label: 'Medium', class: 'priority-medium' },
  HIGH: { label: 'High', class: 'priority-high' },
  URGENT: { label: 'Urgent', class: 'priority-urgent' },
};

interface Props {
  task: Task;
  compact?: boolean;
}

export default function TaskCard({ task, compact = false }: Props) {
  const { toggleComplete, deleteTask } = useTaskStore();
  const { openTaskModal } = useUIStore();
  const [showMenu, setShowMenu] = useState(false);

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'COMPLETED';
  const priority = PRIORITY_CONFIG[task.priority];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this task?')) await deleteTask(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ y: -1 }}
      className={`card p-4 group cursor-pointer transition-all duration-200 hover:shadow-soft
        ${task.status === 'COMPLETED' ? 'opacity-60' : ''}
        ${isOverdue ? 'border-red-200 dark:border-red-900/50' : ''}`}
      onClick={() => openTaskModal(task.id)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); toggleComplete(task.id); }}
          className="mt-0.5 flex-shrink-0 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {task.status === 'COMPLETED'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            : <Circle className="w-5 h-5" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug
            ${task.status === 'COMPLETED' ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>
            {task.title}
          </p>

          {!compact && task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`badge ${priority.class}`}>{priority.label}</span>

            {task.category && (
              <span
                className="badge text-white text-xs"
                style={{ backgroundColor: task.category.color }}
              >
                {task.category.icon} {task.category.name}
              </span>
            )}

            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                {format(new Date(task.dueDate), 'MMM d')}
                {task.dueTime && ` · ${task.dueTime}`}
              </span>
            )}

            {task.reminders && task.reminders.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-indigo-500">
                <Bell className="w-3 h-3" />
                {task.reminders.length}
              </span>
            )}

            {task.tags.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Tag className="w-3 h-3" />
                {task.tags.slice(0, 2).join(', ')}
                {task.tags.length > 2 && `+${task.tags.length - 2}`}
              </span>
            )}

            {task.recurring && (
              <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                🔁 {task.recurring.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden z-20"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); openTaskModal(task.id); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator for urgent tasks */}
      {task.priority === 'URGENT' && task.status !== 'COMPLETED' && (
        <div className="mt-3 h-0.5 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 w-full animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}
