/**
 * Google Integration Card Component for Settings Page
 * Compact version for embedding in settings
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Google,
  Email,
  Settings,
  CheckCircle,
  Error,
  Warning,
  Launch,
} from '@mui/icons-material';

interface GoogleIntegration {
  id: string;
  google_email: string;
  status: 'connected' | 'disconnected' | 'expired' | 'revoked' | 'error';
  auto_apply_enabled: boolean;
  auto_apply_filters: Record<string, any>;
  last_sync: string;
  error_count: number;
}

const GoogleIntegrationCard: React.FC = () => {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);

  // Load integration data on mount
  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/google/integration/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      
      if (data.integration) {
        setIntegration(data.integration);
      }
    } catch (err) {
      console.error('Failed to load Google integration data:', err);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/google/oauth/authorize/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      
      if (data.authorization_url) {
        // Redirect to Google OAuth
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      setError('Failed to initiate Google OAuth');
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/google/integration/disconnect/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        setSuccess('Google account disconnected successfully');
        setIntegration(null);
        setOpenDialog(false);
      } else {
        setError('Failed to disconnect Google account');
      }
    } catch (err) {
      setError('Failed to disconnect Google account');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoApplyToggle = async (enabled: boolean) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/google/integration/update_auto_apply_settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          auto_apply_enabled: enabled,
          auto_apply_filters: integration?.auto_apply_filters || {},
        }),
      });
      
      if (response.ok) {
        setSuccess(`Auto-apply ${enabled ? 'enabled' : 'disabled'}`);
        loadIntegrationData();
      } else {
        setError('Failed to update auto-apply settings');
      }
    } catch (err) {
      setError('Failed to update auto-apply settings');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'expired': return 'warning';
      case 'error': case 'revoked': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle color="success" />;
      case 'expired': return <Warning color="warning" />;
      case 'error': case 'revoked': return <Error color="error" />;
      default: return <Google />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Google sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">Google Integration</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <List>
          {/* Connection Status */}
          <ListItem>
            <ListItemIcon>
              {integration ? getStatusIcon(integration.status) : <Google />}
            </ListItemIcon>
            <ListItemText
              primary="Google Account"
              secondary={
                integration 
                  ? `Connected as ${integration.google_email}`
                  : "Connect your Gmail account for automated job applications"
              }
            />
            <ListItemSecondaryAction>
              {integration ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={integration.status}
                    color={getStatusColor(integration.status)}
                    size="small"
                  />
                  <Button
                    size="small"
                    onClick={() => setOpenDialog(true)}
                    disabled={loading}
                  >
                    Manage
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Google />}
                  onClick={handleConnectGoogle}
                  disabled={loading}
                  size="small"
                >
                  {loading ? <CircularProgress size={20} /> : 'Connect'}
                </Button>
              )}
            </ListItemSecondaryAction>
          </ListItem>

          {/* Auto-Apply Settings */}
          {integration?.status === 'connected' && (
            <>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Auto-Apply"
                  secondary="Automatically apply to jobs matching your criteria"
                />
                <ListItemSecondaryAction>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={integration.auto_apply_enabled}
                        onChange={(e) => handleAutoApplyToggle(e.target.checked)}
                      />
                    }
                    label=""
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText
                  primary="Advanced Settings"
                  secondary="Configure filters, view statistics, and manage responses"
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    endIcon={<Launch />}
                    onClick={() => window.open('/google-integration', '_blank')}
                  >
                    Open Dashboard
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </>
          )}
        </List>
      </CardContent>

      {/* Management Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Google sx={{ mr: 1 }} />
            Manage Google Integration
          </Box>
        </DialogTitle>
        <DialogContent>
          {integration && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Connected Account: {integration.google_email}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Status: <Chip label={integration.status} color={getStatusColor(integration.status)} size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Last sync: {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Never'}
              </Typography>
              
              {integration.error_count > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {integration.error_count} error(s) detected. Consider reconnecting your account.
                </Alert>
              )}

              <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                Disconnecting will:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>Stop all automated job applications</li>
                <li>Remove access to your Gmail account</li>
                <li>Clear all stored tokens securely</li>
                <li>Preserve your job application history</li>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDisconnectGoogle}
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            Disconnect Account
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default GoogleIntegrationCard; 