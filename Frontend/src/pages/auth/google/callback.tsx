/**
 * Google OAuth Callback Page for JobPilot (EvolJobs.com)
 * Handles the OAuth callback from Google and completes the integration
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { CheckCircle, Error, Google } from '@mui/icons-material';

const GoogleOAuthCallback: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const { code, state, error } = router.query;

    if (error) {
      setStatus('error');
      setMessage(`OAuth error: ${error}`);
      return;
    }

    if (code && state) {
      handleOAuthCallback(code as string, state as string);
    }
  }, [router.query]);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/google/oauth/callback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Google account connected successfully!');
        
        // Redirect to settings page after 3 seconds
        setTimeout(() => {
          router.push('/settings?tab=integrations');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to complete OAuth flow');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error occurred while connecting to Google');
    }
  };

  const handleRetry = () => {
    router.push('/settings?tab=integrations');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Google sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h5" gutterBottom>
            Google Integration
          </Typography>

          {status === 'processing' && (
            <Box>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Completing Google OAuth integration...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Please wait while we securely connect your Google account.
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <Box>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Redirecting to settings page...
              </Typography>
            </Box>
          )}

          {status === 'error' && (
            <Box>
              <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
              <Alert severity="error" sx={{ mb: 2 }}>
                {message}
              </Alert>
              <Button
                variant="contained"
                onClick={handleRetry}
                sx={{ mt: 2 }}
              >
                Go to Settings
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default GoogleOAuthCallback; 