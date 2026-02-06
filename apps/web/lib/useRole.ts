'use client';

import { useAuthStore } from '../store/authStore';

export type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  DEVELOPER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function useRole() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'VIEWER') as UserRole;

  const hasRole = (minRole: UserRole): boolean => {
    if (role === 'ADMIN') return true;
    return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
  };

  return {
    role,
    hasRole,
    isAdmin: role === 'ADMIN',
    isManager: hasRole('MANAGER'),
    isDeveloper: hasRole('DEVELOPER'),
    isViewer: role === 'VIEWER',
  };
}
