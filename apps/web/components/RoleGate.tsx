'use client';

import { ReactNode } from 'react';
import { useRole, UserRole } from '../lib/useRole';

interface RoleGateProps {
  minRole: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children only if the current user's role
 * meets or exceeds the specified minimum role.
 */
export function RoleGate({ minRole, children, fallback = null }: RoleGateProps) {
  const { hasRole } = useRole();

  if (!hasRole(minRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
