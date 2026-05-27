import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const { user, token } = await authService.login({ email, password, rememberMe });
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      signup: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { user, token } = await authService.signup({ name, email, password });
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        if (!get().token) return;
        try {
          const user = await authService.getMe();
          set({ user });
        } catch {
          get().logout();
        }
      },

      updateUser: (updates) => {
        set(state => ({ user: state.user ? { ...state.user, ...updates } : null }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
