import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  role: string;
  children: ReactNode;
}

/**
 * Wraps a route and redirects to /dashboard if the user
 * does not have the required role.
 */
export default function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user || user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
