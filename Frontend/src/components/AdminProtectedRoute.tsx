import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      } else if (!isAdmin) {
        // Authenticated but not admin, redirect based on user type
        if (user?.user_type === 'employer') {
          router.push('/dashboard');
        } else if (user?.user_type === 'job_seeker') {
          router.push('/jobs');
        } else {
          router.push('/');
        }
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, user, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingScreen variant="admin" message="Checking permissions..." />;
  }

  // Don't render anything if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  // Render children if authenticated and admin
  return <>{children}</>;
};

export default AdminProtectedRoute; 