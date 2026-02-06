'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getAuthToken } from './clerkTokenBridge';

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'DEVELOPER' | 'VIEWER';
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
      const token = getAuthToken();
      if (!token) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
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
