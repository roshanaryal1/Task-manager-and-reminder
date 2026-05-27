import { Outlet } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import TaskModal from '../tasks/TaskModal';

export default function AppLayout() {
  const { sidebarOpen, taskModalOpen } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Task create/edit modal */}
      {taskModalOpen && <TaskModal />}
    </div>
  );
}
