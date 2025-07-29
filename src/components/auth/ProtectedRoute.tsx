import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { authState } from '@/lib/recoil/atoms';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useRecoilValue(authState);

  // Only redirect if we're sure the user is not authenticated
  // This prevents race conditions during auth state hydration
  if (!auth.isAuthenticated || (!auth.doctor && !auth.patient)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};