/**
 * Google OAuth Callback Page for JobPilot (EvolJobs.com)
 * Handles the OAuth callback from Google and completes the integration
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

const GoogleOAuthCallback: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate processing
      if (hasProcessed) {
        console.log('OAuth callback already processed, skipping...');
        return;
      }

      const { code, state, error } = router.query;

      // Only proceed if we have all required parameters
      if (!router.isReady) {
        return;
      }

      if (error) {
        setStatus('error');
        setMessage('OAuth authorization was cancelled or failed');
        setHasProcessed(true);
        return;
      }

      if (code && state && !hasProcessed) {
        console.log('Processing OAuth callback...');
        setHasProcessed(true);
        await handleOAuthCallback(code as string, state as string);
      }
    };

    handleCallback();
  }, [router.isReady, router.query, hasProcessed]);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const flowType = localStorage.getItem('oauth_flow_type') || 'login';
      
      // Use the unified Google auth endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/login/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens and user data
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setStatus('success');
        
        // Clean up flow data
        localStorage.removeItem('oauth_flow_type');
        
        if (data.is_new_user) {
          // New user - redirect to job interests page
          setMessage('Welcome to JobPilot! Let\'s set up your job interests.');
          setTimeout(() => {
            router.push('/job-interests');
          }, 2000);
        } else {
          // Existing user - redirect to appropriate dashboard
          setMessage('Welcome back! Redirecting to your dashboard.');
          setTimeout(() => {
            const isAdmin = data.user.user_type === 'admin' || data.user.is_staff || data.user.is_superuser;
            if (isAdmin) {
              router.push('/admin_dashboard');
            } else {
              router.push('/dashboard');
            }
          }, 2000);
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to authenticate with Google');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error occurred while connecting to Google');
    }
  };

  const handleRetry = () => {
    router.push('/login');
  };

  const getTitle = () => {
    return 'Google Authentication';
  };

  const getProcessingMessage = () => {
    return 'Authenticating with Google...';
  };

  const getProcessingDescription = () => {
    return 'Please wait while we authenticate your Google account.';
  };

  const getSuccessDescription = () => {
    return 'Redirecting...';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              {status === 'loading' && (
                <div className="flex justify-center mb-4">
                  <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {getTitle()}
              </h1>
              
              {status === 'loading' && (
                <>
                  <h2 className="text-lg font-medium text-gray-700 mb-2">
                    {getProcessingMessage()}
                  </h2>
                  <p className="text-gray-600">
                    {getProcessingDescription()}
                  </p>
                </>
              )}
              
              {status === 'success' && (
                <>
                  <h2 className="text-lg font-medium text-green-700 mb-2">
                    Authentication Successful!
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {message}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getSuccessDescription()}
                  </p>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <h2 className="text-lg font-medium text-red-700 mb-2">
                    Authentication Failed
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {message}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
            
            {status === 'loading' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default GoogleOAuthCallback; 