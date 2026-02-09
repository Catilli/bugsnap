'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { getAuthToken } from '../lib/clerkTokenBridge';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
  issue?: { id: string; title: string } | null;
  project?: { id: string; name: string } | null;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchNotifications = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch {
      // Silently fail
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
      const token = getAuthToken();
      if (!token) return;

      await fetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const markAllRead = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
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
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
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
              No notifications
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    if (notification.issue) {
                      // Navigation would be handled here — for now just close
                      setIsOpen(false);
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
