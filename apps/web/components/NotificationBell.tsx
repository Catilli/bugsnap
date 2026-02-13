'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getAuthToken } from '../lib/clerkTokenBridge';
import { authFetch } from '../lib/api';
import { notifyError } from '../lib/toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
  issue?: { id: string; title: string } | null;
  project?: { id: string; name: string } | null;
  feedback?: { id: string; title: string } | null;
}

interface NotificationBellProps {
  category?: 'issue' | 'feedback';
  icon?: ReactNode;
  title?: string;
  emptyMessage?: string;
  hoverColorClass?: string;
  onIconClick?: () => void;
}

export default function NotificationBell({
  category,
  icon,
  title = 'Notifications',
  emptyMessage = 'No notifications',
  hoverColorClass = 'hover:text-gray-700',
  onIconClick,
}: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchNotifications = async () => {
    try {
      if (!getAuthToken()) return;

      const params = new URLSearchParams();
      if (category) params.set('category', category);
      const qs = params.toString();

      const response = await authFetch(`${apiUrl}/api/notifications${qs ? `?${qs}` : ''}`);

      if (response.ok) {
        let data: Notification[] = await response.json();
        // Client-side filter as fallback in case backend doesn't support category yet
        if (category === 'issue') {
          data = data.filter((n) => !n.feedback);
        } else if (category === 'feedback') {
          data = data.filter((n) => !!n.feedback);
        }
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    } catch {
      notifyError('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      if (!getAuthToken()) return;

      await authFetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: 'PATCH',
      });

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      notifyError('Failed to mark notification as read');
    }
  };

  const markAllRead = async () => {
    try {
      if (!getAuthToken()) return;

      await authFetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category ? { category } : {}),
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      notifyError('Failed to mark notifications as read');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${Math.floor(diffHour / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onIconClick || (() => setIsOpen(!isOpen))}
        className={`p-2 text-gray-500 ${hoverColorClass} rounded-lg transition-colors relative`}
        title={title}
      >
        {icon || <Bell className="w-5 h-5" />}
        {unreadCount > 0 && (
          <span
            onClick={onIconClick ? (e) => { e.stopPropagation(); setIsOpen(!isOpen); } : undefined}
            className={`absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center${onIconClick ? ' cursor-pointer hover:bg-red-600' : ''}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    setIsOpen(false);
                    // Navigate to the relevant project/issue
                    if (notification.issue && notification.project) {
                      router.push(`/dashboard/projects/${notification.project.id}?issue=${notification.issue.id}`);
                    } else if (notification.project) {
                      router.push(`/dashboard/projects/${notification.project.id}`);
                    }
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                    !notification.read ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                    )}
                    <div className={`flex-1 min-w-0 ${notification.read ? 'ml-4' : ''}`}>
                      <p className="text-sm text-gray-900 font-medium truncate">{notification.title}</p>
                      {notification.message && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{notification.message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
