import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import TaskCard from '../components/tasks/TaskCard';
import { TaskStatus, Task } from '../types';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'PENDING', label: '📋 To Do', color: 'bg-slate-100 dark:bg-slate-800' },
  { status: 'IN_PROGRESS', label: '⚡ In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { status: 'COMPLETED', label: '✅ Done', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { status: 'CANCELLED', label: '🚫 Cancelled', color: 'bg-slate-50 dark:bg-slate-900' },
];

export default function KanbanPage() {
  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const { openTaskModal } = useUIStore();

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const getTasksForStatus = (status: TaskStatus): Task[] =>
    tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) await updateTask(taskId, { status });
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kanban Board</h1>
        <button onClick={() => openTaskModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {COLUMNS.map(col => {
          const colTasks = getTasksForStatus(col.status);
          return (
            <div
              key={col.status}
              className="flex-shrink-0 w-72"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, col.status)}
            >
              {/* Column header */}
              <div className={`${col.color} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div
                className={`${col.color} rounded-b-xl p-2 space-y-2 min-h-40`}
              >
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard task={task} compact />
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-slate-300 dark:text-slate-600 text-sm">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
