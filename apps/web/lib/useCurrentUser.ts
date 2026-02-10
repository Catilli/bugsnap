'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getAuthToken } from './clerkTokenBridge';
import { authFetch } from './api';

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';
}

let cachedUser: CurrentUser | null = null;

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      cachedUser = null;
      return;
    }

    // Use cached value if available
    if (cachedUser) {
      setUser(cachedUser);
      return;
    }

    const fetchUser = async () => {
      if (!getAuthToken()) return;

      try {
        const response = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`,
        );

        if (response.ok) {
          const data = await response.json();
          cachedUser = data;
          setUser(data);
        }
      } catch {
        // Silently fail
      }
    };

    fetchUser();
  }, [isAuthenticated]);

  return user;
}
