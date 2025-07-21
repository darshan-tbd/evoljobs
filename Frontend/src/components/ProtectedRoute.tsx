import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  requireSuperuser?: boolean;
  requireStaff?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRoles = [],
  requireSuperuser = false,
  requireStaff = false,
}) => {
  const { isAuthenticated, user, isLoading, isSuperuser, isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        return;
      }

      if (isAuthenticated && user) {
        // Check superuser requirement
        if (requireSuperuser && !isSuperuser) {
          router.push('/unauthorized');
          return;
        }

        // Check staff requirement
        if (requireStaff && !isStaff) {
          router.push('/unauthorized');
          return;
        }

        // Check role requirements
        if (requiredRoles.length > 0 && !requiredRoles.includes(user.user_type)) {
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router, requireAuth, requiredRoles, requireSuperuser, requireStaff, isSuperuser, isStaff]);

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (requireAuth && !isAuthenticated) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  if (isAuthenticated && user) {
    // Check access permissions
    if (requireSuperuser && !isSuperuser) {
      return <LoadingScreen message="Checking permissions..." />;
    }

    if (requireStaff && !isStaff) {
      return <LoadingScreen message="Checking permissions..." />;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.user_type)) {
      return <LoadingScreen message="Checking permissions..." />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 