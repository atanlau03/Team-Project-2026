import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  roles: string[];
  children: ReactNode;
}

/**
 * Wraps a route and redirects to /dashboard if the user
 * does not have one of the required roles.
 */
export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
