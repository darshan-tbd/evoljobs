/**
 * Google Integration Component for JobPilot (EvolJobs.com)
 * Handles Google OAuth connection, auto-apply settings, and email monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Chip,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Google,
  Email,
  Settings,
  PlayArrow,
  Stop,
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Info,
  Timeline,
  Reply,
  Assignment,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface GoogleIntegration {
  id: string;
  user_email: string;
  google_email: string;
  status: 'connected' | 'disconnected' | 'expired' | 'revoked' | 'error';
  token_status: 'valid' | 'expired';
  last_sync: string;
  auto_apply_enabled: boolean;
  auto_apply_filters: Record<string, any>;
  error_count: number;
  last_error: string;
  created_at: string;
  updated_at: string;
}

interface EmailRecord {
  id: string;
  job_title: string;
  job_company: string;
  to_email: string;
  subject: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'replied';
  sent_at: string;
  response_count: number;
  last_response_at?: string;
}

interface EmailResponse {
  id: string;
  sent_email_subject: string;
  job_title: string;
  job_company: string;
  from_email: string;
  subject: string;
  received_at: string;
  response_type: 'reply' | 'auto_reply' | 'interview_invitation' | 'rejection' | 'request_info' | 'other';
  is_processed: boolean;
  requires_action: boolean;
}

interface DashboardStats {
  integration_status: string;
  auto_apply_enabled: boolean;
  google_email: string;
  last_sync: string;
  emails_sent_today: number;
  emails_sent_this_week: number;
  emails_sent_this_month: number;
  responses_received: number;
  unprocessed_responses: number;
  active_sessions: number;
  quota_usage: {
    emails_sent: number;
    max_emails: number;
    email_percentage: number;
    api_calls: number;
    max_api_calls: number;
    api_percentage: number;
  };
}

const GoogleIntegrationComponent: React.FC = () => {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [responses, setResponses] = useState<EmailResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);
  const [autoApplyFilters, setAutoApplyFilters] = useState({
    keywords: '',
    location: '',
    job_type: '',
    experience_level: '',
    salary_min: '',
  });

  // Load integration data on component mount
  useEffect(() => {
    loadIntegrationData();
    loadDashboardStats();
    loadEmails();
    loadResponses();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/integration/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      
      if (data.integration) {
        setIntegration(data.integration);
        setAutoApplyFilters(data.integration.auto_apply_filters || {});
      }
    } catch (err) {
      setError('Failed to load Google integration data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/v1/google/dashboard/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  const loadEmails = async () => {
    try {
      const response = await fetch('/api/v1/google/emails/?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (err) {
      console.error('Failed to load emails:', err);
    }
  };

  const loadResponses = async () => {
    try {
      const response = await fetch('/api/v1/google/emails/responses/?limit=10&unprocessed_only=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      setResponses(data.responses || []);
    } catch (err) {
      console.error('Failed to load responses:', err);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/oauth/authorize/', {
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
      const response = await fetch('/api/v1/google/integration/disconnect/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        setSuccess('Google account disconnected successfully');
        loadIntegrationData();
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
      const response = await fetch('/api/v1/google/integration/update_auto_apply_settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          auto_apply_enabled: enabled,
          auto_apply_filters: autoApplyFilters,
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

  const handleUpdateFilters = async () => {
    try {
      const response = await fetch('/api/v1/google/integration/update_auto_apply_settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          auto_apply_enabled: integration?.auto_apply_enabled,
          auto_apply_filters: autoApplyFilters,
        }),
      });
      
      if (response.ok) {
        setSuccess('Auto-apply filters updated');
        setOpenFiltersDialog(false);
        loadIntegrationData();
      } else {
        setError('Failed to update filters');
      }
    } catch (err) {
      setError('Failed to update filters');
    }
  };

  const handleTriggerAutoApply = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/integration/trigger_auto_apply/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          max_applications: 10,
        }),
      });
      
      if (response.ok) {
        setSuccess('Auto-apply process started');
      } else {
        setError('Failed to start auto-apply process');
      }
    } catch (err) {
      setError('Failed to start auto-apply process');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/integration/check_responses/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        setSuccess('Response check started');
        setTimeout(loadResponses, 2000); // Refresh responses after 2 seconds
      } else {
        setError('Failed to check responses');
      }
    } catch (err) {
      setError('Failed to check responses');
    } finally {
      setLoading(false);
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

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'interview_invitation': return 'success';
      case 'rejection': return 'error';
      case 'request_info': return 'warning';
      case 'auto_reply': return 'default';
      default: return 'info';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
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

      <Typography variant="h4" gutterBottom>
        <Google sx={{ mr: 1, verticalAlign: 'middle' }} />
        Google Integration
      </Typography>

      <Grid container spacing={3}>
        {/* Connection Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connection Status
              </Typography>
              
              {integration ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={integration.status}
                      color={getStatusColor(integration.status)}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {integration.google_email}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Last sync: {integration.last_sync ? format(new Date(integration.last_sync), 'PPpp') : 'Never'}
                  </Typography>
                  
                  {integration.status === 'connected' && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDisconnectGoogle}
                      disabled={loading}
                    >
                      Disconnect Google Account
                    </Button>
                  )}
                  
                  {integration.last_error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {integration.last_error}
                    </Alert>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Connect your Google account to enable automated job applications via Gmail.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Google />}
                    onClick={handleConnectGoogle}
                    disabled={loading}
                  >
                    Connect Google Account
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Auto-Apply Settings Card */}
        {integration?.status === 'connected' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Auto-Apply Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={integration.auto_apply_enabled}
                      onChange={(e) => handleAutoApplyToggle(e.target.checked)}
                    />
                  }
                  label="Enable Auto-Apply"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={() => setOpenFiltersDialog(true)}
                  >
                    Configure Filters
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleTriggerAutoApply}
                    disabled={!integration.auto_apply_enabled || loading}
                  >
                    Trigger Now
                  </Button>
                </Box>
                
                {Object.keys(autoApplyFilters).length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Active Filters:
                    </Typography>
                    {Object.entries(autoApplyFilters).map(([key, value]) => (
                      value && (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Dashboard Stats */}
        {stats && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dashboard Statistics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.emails_sent_today}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Emails Today
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stats.emails_sent_this_week}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Emails This Week
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {stats.responses_received}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Responses
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {stats.unprocessed_responses}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Unprocessed
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Daily Quota Usage
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Emails: {stats.quota_usage.emails_sent} / {stats.quota_usage.max_emails}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.quota_usage.email_percentage}
                    color={stats.quota_usage.email_percentage > 80 ? 'warning' : 'primary'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Emails */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Emails
                </Typography>
                <Button size="small" onClick={loadEmails}>
                  <Refresh />
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Job</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sent</TableCell>
                      <TableCell>Responses</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {email.job_title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {email.job_company}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={email.status}
                            size="small"
                            color={email.status === 'replied' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {format(new Date(email.sent_at), 'MMM d')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {email.response_count > 0 ? (
                            <Chip label={email.response_count} size="small" color="success" />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Responses */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <Reply sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Responses
                </Typography>
                <Button size="small" onClick={handleCheckResponses} disabled={loading}>
                  <Refresh />
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Job</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>Received</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {response.job_title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {response.job_company}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={response.response_type.replace('_', ' ')}
                            size="small"
                            color={getResponseTypeColor(response.response_type)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {response.from_email.split('@')[0]}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {format(new Date(response.received_at), 'MMM d')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters Dialog */}
      <Dialog open={openFiltersDialog} onClose={() => setOpenFiltersDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Auto-Apply Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Keywords"
                value={autoApplyFilters.keywords || ''}
                onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="e.g., software engineer, developer"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={autoApplyFilters.location || ''}
                onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., San Francisco, Remote"
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={autoApplyFilters.job_type || ''}
                  onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, job_type: e.target.value }))}
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="full_time">Full Time</MenuItem>
                  <MenuItem value="part_time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={autoApplyFilters.experience_level || ''}
                  onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, experience_level: e.target.value }))}
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="mid">Mid Level</MenuItem>
                  <MenuItem value="senior">Senior Level</MenuItem>
                  <MenuItem value="executive">Executive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Minimum Salary"
                type="number"
                value={autoApplyFilters.salary_min || ''}
                onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, salary_min: e.target.value }))}
                placeholder="e.g., 80000"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFiltersDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateFilters} variant="contained">Save Filters</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleIntegrationComponent; 