import { create } from 'zustand';
import { Task, TaskStatus, Priority } from '../types';
import { taskService } from '../services/taskService';
import toast from 'react-hot-toast';

interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  categoryId?: string;
  search?: string;
}

interface TaskState {
  tasks: Task[];
  total: number;
  isLoading: boolean;
  filters: TaskFilters;
  selectedIds: string[];

  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  reorderTasks: (tasks: { id: string; position: number }[]) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  bulkDelete: () => Promise<void>;
  bulkComplete: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  total: 0,
  isLoading: false,
  filters: {},
  selectedIds: [],

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const { tasks, total } = await taskService.getAll(get().filters);
      set({ tasks, total, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createTask: async (data) => {
    const task = await taskService.create(data);
    set(state => ({ tasks: [task, ...state.tasks], total: state.total + 1 }));
    toast.success('Task created!');
    return task;
  },

  updateTask: async (id, data) => {
    const updated = await taskService.update(id, data);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? updated : t),
    }));
  },

  deleteTask: async (id) => {
    await taskService.delete(id);
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
      total: state.total - 1,
    }));
    toast.success('Task deleted');
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await get().updateTask(id, { status: newStatus });
    if (newStatus === 'COMPLETED') toast.success('Task completed! 🎉');
  },

  reorderTasks: async (items) => {
    // Optimistic update
    const newTasks = [...get().tasks];
    items.forEach(({ id, position }) => {
      const t = newTasks.find(task => task.id === id);
      if (t) t.position = position;
    });
    set({ tasks: newTasks.sort((a, b) => a.position - b.position) });
    await taskService.reorder(items);
  },

  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
    get().fetchTasks();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchTasks();
  },

  toggleSelect: (id) => {
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(i => i !== id)
        : [...state.selectedIds, id],
    }));
  },

  clearSelection: () => set({ selectedIds: [] }),

  bulkDelete: async () => {
    const { selectedIds } = get();
    await Promise.all(selectedIds.map(id => taskService.delete(id)));
    set(state => ({
      tasks: state.tasks.filter(t => !selectedIds.includes(t.id)),
      total: state.total - selectedIds.length,
      selectedIds: [],
    }));
    toast.success(`Deleted ${selectedIds.length} tasks`);
  },

  bulkComplete: async () => {
    const { selectedIds } = get();
    await taskService.bulkUpdate(selectedIds, { status: 'COMPLETED' });
    set(state => ({
      tasks: state.tasks.map(t =>
        selectedIds.includes(t.id) ? { ...t, status: 'COMPLETED' as TaskStatus, completedAt: new Date().toISOString() } : t
      ),
      selectedIds: [],
    }));
    toast.success(`Completed ${selectedIds.length} tasks`);
  },
}));
