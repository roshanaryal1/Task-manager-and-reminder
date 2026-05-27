import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type View = 'list' | 'kanban' | 'calendar';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeView: View;
  taskModalOpen: boolean;
  taskModalId: string | null; // null = create, string = edit

  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: View) => void;
  openTaskModal: (id?: string) => void;
  closeTaskModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      activeView: 'list',
      taskModalOpen: false,
      taskModalId: null,

      toggleTheme: () =>
        set(state => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', next === 'dark');
          return { theme: next };
        }),

      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },

      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveView: (view) => set({ activeView: view }),
      openTaskModal: (id) => set({ taskModalOpen: true, taskModalId: id ?? null }),
      closeTaskModal: () => set({ taskModalOpen: false, taskModalId: null }),
    }),
    {
      name: 'ui-storage',
      partialize: state => ({ theme: state.theme, activeView: state.activeView }),
      onRehydrateStorage: () => state => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
