import api from './api';
import { Reminder } from '../types';

export const reminderService = {
  getAll: (status?: string) =>
    api.get<Reminder[]>('/reminders', { params: status ? { status } : {} }).then(r => r.data),

  getPending: () =>
    api.get<Reminder[]>('/reminders/pending').then(r => r.data),

  create: (data: Partial<Reminder>) =>
    api.post<Reminder>('/reminders', data).then(r => r.data),

  update: (id: string, data: Partial<Reminder>) =>
    api.patch<Reminder>(`/reminders/${id}`, data).then(r => r.data),

  snooze: (id: string, minutes = 10) =>
    api.post<Reminder>(`/reminders/${id}/snooze`, { minutes }).then(r => r.data),

  dismiss: (id: string) =>
    api.post<Reminder>(`/reminders/${id}/dismiss`).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/reminders/${id}`).then(r => r.data),
};
