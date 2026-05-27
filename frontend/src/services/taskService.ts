import api from './api';
import { Task, PaginatedTasks } from '../types';

interface TaskFilters {
  status?: string;
  priority?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const taskService = {
  getAll: (filters?: TaskFilters) =>
    api.get<PaginatedTasks>('/tasks', { params: filters }).then(r => r.data),

  getById: (id: string) =>
    api.get<Task>(`/tasks/${id}`).then(r => r.data),

  create: (data: Partial<Task>) =>
    api.post<Task>('/tasks', data).then(r => r.data),

  update: (id: string, data: Partial<Task>) =>
    api.patch<Task>(`/tasks/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`).then(r => r.data),

  reorder: (tasks: { id: string; position: number }[]) =>
    api.patch('/tasks/reorder', { tasks }).then(r => r.data),

  bulkUpdate: (ids: string[], data: Partial<Task>) =>
    api.patch('/tasks/bulk', { ids, data }).then(r => r.data),
};
