/**
 * Simple Google Integration Button Component
 * Can be used in dashboard, header, or any other location
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

interface GoogleIntegrationStatus {
  connected: boolean;
  google_email?: string;
  status?: string;
}

const GoogleIntegrationButton: React.FC = () => {
  const router = useRouter();
  const [integration, setIntegration] = useState<GoogleIntegrationStatus>({ connected: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/google/integration/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.integration) {
          setIntegration({
            connected: data.integration.status === 'connected',
            google_email: data.integration.google_email,
            status: data.integration.status,
          });
        }
      }
    } catch (err) {
      console.error('Failed to check Google integration status:', err);
    }
  };

  const handleConnect = async () => {
    if (integration.connected) {
      // Navigate to Google integration page
      router.push('/google-integration');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/google/oauth/authorize/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      console.error('Failed to initiate Google OAuth:', err);
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!integration.connected) return 'bg-gray-100 text-gray-700 border-gray-300';
    if (integration.status === 'connected') return 'bg-green-100 text-green-700 border-green-300';
    if (integration.status === 'expired') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getStatusText = () => {
    if (!integration.connected) return 'Connect Gmail';
    if (integration.status === 'connected') return `Gmail: ${integration.google_email?.split('@')[0]}`;
    if (integration.status === 'expired') return 'Gmail: Expired';
    return 'Gmail: Error';
  };

  const getIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
      );
    }
    
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    );
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleConnect}
      disabled={loading}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium
        transition-all duration-200 hover:shadow-md
        ${getStatusColor()}
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
      `}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getStatusText()}</span>
      <span className="sm:hidden">Gmail</span>
    </motion.button>
  );
};

export default GoogleIntegrationButton; 