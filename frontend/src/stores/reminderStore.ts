import { create } from 'zustand';
import { Reminder } from '../types';
import { reminderService } from '../services/reminderService';
import toast from 'react-hot-toast';

interface ReminderState {
  reminders: Reminder[];
  activeReminders: Reminder[]; // reminders that are currently showing a popup
  isLoading: boolean;

  fetchReminders: () => Promise<void>;
  createReminder: (data: Partial<Reminder>) => Promise<void>;
  updateReminder: (id: string, data: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string, minutes?: number) => Promise<void>;
  dismissReminder: (id: string) => Promise<void>;
  addActiveReminder: (reminder: Reminder) => void;
  removeActiveReminder: (id: string) => void;
  checkPendingReminders: () => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  activeReminders: [],
  isLoading: false,

  fetchReminders: async () => {
    set({ isLoading: true });
    try {
      const reminders = await reminderService.getAll('PENDING');
      set({ reminders, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createReminder: async (data) => {
    const reminder = await reminderService.create(data);
    set(state => ({ reminders: [reminder, ...state.reminders] }));
    toast.success('Reminder set!');
  },

  updateReminder: async (id, data) => {
    const updated = await reminderService.update(id, data);
    set(state => ({
      reminders: state.reminders.map(r => r.id === id ? updated : r),
    }));
  },

  deleteReminder: async (id) => {
    await reminderService.delete(id);
    set(state => ({
      reminders: state.reminders.filter(r => r.id !== id),
      activeReminders: state.activeReminders.filter(r => r.id !== id),
    }));
  },

  snoozeReminder: async (id, minutes = 10) => {
    const updated = await reminderService.snooze(id, minutes);
    set(state => ({
      reminders: state.reminders.map(r => r.id === id ? updated : r),
      activeReminders: state.activeReminders.filter(r => r.id !== id),
    }));
    toast.success(`Snoozed for ${minutes} minutes`);
  },

  dismissReminder: async (id) => {
    await reminderService.dismiss(id);
    set(state => ({
      reminders: state.reminders.filter(r => r.id !== id),
      activeReminders: state.activeReminders.filter(r => r.id !== id),
    }));
  },

  addActiveReminder: (reminder) => {
    set(state => ({
      activeReminders: state.activeReminders.some(r => r.id === reminder.id)
        ? state.activeReminders
        : [...state.activeReminders, reminder],
    }));
  },

  removeActiveReminder: (id) => {
    set(state => ({
      activeReminders: state.activeReminders.filter(r => r.id !== id),
    }));
  },

  // Called every 10 seconds — fetches due reminders from backend
  checkPendingReminders: async () => {
    try {
      const triggered = await reminderService.getPending();
      triggered.forEach(reminder => get().addActiveReminder(reminder));
    } catch {
      // Silent fail — don't spam errors for background polling
    }
  },
}));
