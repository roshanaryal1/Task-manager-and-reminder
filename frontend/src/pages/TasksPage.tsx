import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Filter, LayoutList, Columns2, CheckSquare, Trash2, CheckCheck } from 'lucide-react';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import TaskCard from '../components/tasks/TaskCard';
import { Priority, TaskStatus } from '../types';

const FILTERS_STATUS: { label: string; value: TaskStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

const FILTERS_PRIORITY: { label: string; value: Priority | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
];

export default function TasksPage() {
  const { tasks, isLoading, total, fetchTasks, setFilters, clearFilters, selectedIds, bulkDelete, bulkComplete, clearSelection } = useTaskStore();
  const { openTaskModal } = useUIStore();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusFilter = (s: TaskStatus | 'ALL') => {
    setStatusFilter(s);
    setFilters({ status: s === 'ALL' ? undefined : s });
  };

  const handlePriorityFilter = (p: Priority | 'ALL') => {
    setPriorityFilter(p);
    setFilters({ priority: p === 'ALL' ? undefined : p });
  };

  const empty = !isLoading && tasks.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{total} task{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => openTaskModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 bg-indigo-600 text-white px-4 py-3 rounded-xl"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={bulkComplete} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <CheckCheck className="w-3.5 h-3.5" /> Complete all
              </button>
              <button onClick={bulkDelete} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete all
              </button>
              <button onClick={clearSelection} className="text-sm px-2 py-1.5 hover:bg-white/20 rounded-lg transition-colors">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS_STATUS.map(f => (
            <button
              key={f.value}
              onClick={() => handleStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${statusFilter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS_PRIORITY.map(f => (
            <button
              key={f.value}
              onClick={() => handlePriorityFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${priorityFilter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {(statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
          <button
            onClick={() => { setStatusFilter('ALL'); setPriorityFilter('ALL'); clearFilters(); }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <LayoutList className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No tasks yet</p>
          <p className="text-sm mt-1">Create your first task to get started</p>
          <button onClick={() => openTaskModal()} className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Create task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
