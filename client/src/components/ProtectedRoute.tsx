import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';
import { UserRole } from '../types/marketplace';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, initialized } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-muted">
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && !user.roles.includes(requiredRole)) {
    if (requiredRole === 'vendor') {
      return <Navigate to="/become-a-seller" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

