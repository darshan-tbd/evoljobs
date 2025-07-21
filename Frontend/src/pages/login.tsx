import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only process redirects when router is ready, we're authenticated, and we're actually on the login page
    if (router.isReady && isAuthenticated && !hasRedirected.current && router.pathname === '/login') {
      hasRedirected.current = true;
      const redirectPath = router.query.redirect as string || '/dashboard';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, router.isReady, router.pathname]);

  // If user is authenticated and we're on login page, don't render anything
  if (isAuthenticated && router.pathname === '/login') {
    return null; // Don't render anything while redirecting
  }

  // If user is authenticated but not on login page, don't render login form
  if (isAuthenticated && router.pathname !== '/login') {
    return null;
  }

  return <LoginForm />;
};

export default LoginPage; 