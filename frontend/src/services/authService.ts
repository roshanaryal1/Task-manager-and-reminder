import api from './api';
import { User, UserSettings } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/signup', data).then(r => r.data),

  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post<AuthResponse>('/auth/login', data).then(r => r.data),

  getMe: () =>
    api.get<User>('/auth/me').then(r => r.data),

  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/auth/profile', data).then(r => r.data),

  updateSettings: (data: Partial<UserSettings>) =>
    api.patch<UserSettings>('/auth/settings', data).then(r => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/auth/password', data).then(r => r.data),
};
