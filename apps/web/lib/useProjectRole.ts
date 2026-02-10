'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getAuthToken } from './clerkTokenBridge';
import { authFetch } from './api';

export type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  DEVELOPER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

/**
 * Hook that returns the user's project-scoped role.
 * If the user is a global ADMIN, they always get ADMIN.
 * Otherwise, fetches the project membership to determine the role.
 */
export function useProjectRole(projectId: string | null) {
  const user = useAuthStore((s) => s.user);
  const globalRole = (user?.role ?? 'VIEWER') as UserRole;
  const [projectRole, setProjectRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !user) {
      setIsLoading(false);
      return;
    }

    // ADMIN bypasses — no need to fetch
    if (globalRole === 'ADMIN') {
      setProjectRole('ADMIN');
      setIsLoading(false);
      return;
    }

    const fetchProjectRole = async () => {
      if (!getAuthToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        );

        if (response.ok) {
          const data = await response.json();
          // Check if user is owner (owner = MANAGER-level access)
          if (data.createdBy?.id === user.id) {
            setProjectRole('MANAGER');
          } else {
            // Find membership role
            const membership = data.members?.find(
              (m: any) => m.userId === user.id || m.user?.id === user.id
            );
            setProjectRole((membership?.role as UserRole) ?? 'VIEWER');
          }
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectRole();
  }, [projectId, user, globalRole]);

  const role = projectRole ?? globalRole;

  const hasProjectRole = (minRole: UserRole): boolean => {
    if (role === 'ADMIN') return true;
    return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
  };

  return {
    role,
    isLoading,
    hasProjectRole,
    isAdmin: role === 'ADMIN',
    isManager: hasProjectRole('MANAGER'),
    isDeveloper: hasProjectRole('DEVELOPER'),
    isViewer: role === 'VIEWER',
  };
}
