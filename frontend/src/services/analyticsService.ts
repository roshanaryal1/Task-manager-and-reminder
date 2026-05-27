import api from './api';
import { DashboardStats, WeeklyProgress, ProductivityScore } from '../types';

export const analyticsService = {
  getStats: () => api.get<DashboardStats>('/analytics/stats').then(r => r.data),
  getWeekly: () => api.get<WeeklyProgress[]>('/analytics/weekly').then(r => r.data),
  getProductivity: () => api.get<ProductivityScore>('/analytics/productivity').then(r => r.data),
};
