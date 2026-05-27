import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';
import { Notification } from '../../types';

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications')
      .then(r => {
        setNotifications(r.data.notifications);
        setUnreadCount(r.data.unreadCount);
      });

    const handleClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-notification-dropdown]')) onClose();
    };
    setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  const markAllRead = async () => {
    await api.patch('/notifications/read');
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  return (
    <motion.div
      data-notification-dropdown
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-elevated border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-xs rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 transition-colors" title="Mark all read">
              <Check className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-slate-400">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-indigo-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={() => deleteNotification(n.id)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
