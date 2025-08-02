import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { authState } from '@/lib/recoil/atoms';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'doctor' | 'patient';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const auth = useRecoilValue(authState);

  // Check if user is authenticated
  if (!auth.isAuthenticated || (!auth.doctor && !auth.patient)) {
    return <Navigate to="/" replace />;
  }

  // Check role-based access
  if (requiredRole === 'doctor' && !auth.doctor) {
    return <Navigate to="/patient-dashboard" replace />;
  }
  
  if (requiredRole === 'patient' && !auth.patient) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
