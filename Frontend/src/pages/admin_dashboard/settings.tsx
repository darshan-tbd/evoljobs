import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
  Storage as StorageIcon,
  Speed as PerformanceIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableSSL: boolean;
  };
  security: {
    passwordMinLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableTwoFactor: boolean;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enableSMSNotifications: boolean;
    enablePushNotifications: boolean;
    defaultNotificationFrequency: string;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  performance: {
    enableCaching: boolean;
    cacheTimeout: number;
    enableCompression: boolean;
    maxUploadSize: number;
    enableCDN: boolean;
  };
  business: {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyWebsite: string;
    enableMaintenanceMode: boolean;
    maintenanceMessage: string;
  };
}

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/settings/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSnackbar({ open: true, message: 'Failed to fetch settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/settings/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/test-email/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Test email sent successfully', severity: 'success' });
        setTestEmailDialogOpen(false);
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setSnackbar({ open: true, message: 'Failed to send test email', severity: 'error' });
    }
  };

  const updateSetting = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Typography>Loading settings...</Typography>
        </Box>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Typography>Failed to load settings</Typography>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              System Settings
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Configure platform settings and preferences
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchSettings}
              variant="outlined"
            >
              Reset
            </Button>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          {/* General Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="General Settings"
                avatar={<SettingsIcon />}
              />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Site Name"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Site Description"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                    multiline
                    rows={2}
                  />
                  <TextField
                    fullWidth
                    label="Contact Email"
                    value={settings.general.contactEmail}
                    onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Support Email"
                    value={settings.general.supportEmail}
                    onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.general.timezone}
                      label="Timezone"
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="America/New_York">Eastern Time</MenuItem>
                      <MenuItem value="America/Chicago">Central Time</MenuItem>
                      <MenuItem value="America/Denver">Mountain Time</MenuItem>
                      <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Email Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Email Configuration"
                avatar={<EmailIcon />}
                action={
                  <Button
                    size="small"
                    onClick={() => setTestEmailDialogOpen(true)}
                  >
                    Test Email
                  </Button>
                }
              />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="SMTP Host"
                    value={settings.email.smtpHost}
                    onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="SMTP Port"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                  />
                  <TextField
                    fullWidth
                    label="SMTP Username"
                    value={settings.email.smtpUsername}
                    onChange={(e) => updateSetting('email', 'smtpUsername', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="SMTP Password"
                    type="password"
                    value={settings.email.smtpPassword}
                    onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="From Email"
                    value={settings.email.fromEmail}
                    onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="From Name"
                    value={settings.email.fromName}
                    onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.email.enableSSL}
                        onChange={(e) => updateSetting('email', 'enableSSL', e.target.checked)}
                      />
                    }
                    label="Enable SSL"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Security Settings"
                avatar={<SecurityIcon />}
              />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Minimum Password Length"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.requireSpecialChars}
                        onChange={(e) => updateSetting('security', 'requireSpecialChars', e.target.checked)}
                      />
                    }
                    label="Require Special Characters"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.requireNumbers}
                        onChange={(e) => updateSetting('security', 'requireNumbers', e.target.checked)}
                      />
                    }
                    label="Require Numbers"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.requireUppercase}
                        onChange={(e) => updateSetting('security', 'requireUppercase', e.target.checked)}
                      />
                    }
                    label="Require Uppercase Letters"
                  />
                  <TextField
                    fullWidth
                    label="Session Timeout (minutes)"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                  <TextField
                    fullWidth
                    label="Max Login Attempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.enableTwoFactor}
                        onChange={(e) => updateSetting('security', 'enableTwoFactor', e.target.checked)}
                      />
                    }
                    label="Enable Two-Factor Authentication"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Notification Settings"
                avatar={<NotificationsIcon />}
              />
              <CardContent>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.enableEmailNotifications}
                        onChange={(e) => updateSetting('notifications', 'enableEmailNotifications', e.target.checked)}
                      />
                    }
                    label="Enable Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.enableSMSNotifications}
                        onChange={(e) => updateSetting('notifications', 'enableSMSNotifications', e.target.checked)}
                      />
                    }
                    label="Enable SMS Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.enablePushNotifications}
                        onChange={(e) => updateSetting('notifications', 'enablePushNotifications', e.target.checked)}
                      />
                    }
                    label="Enable Push Notifications"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Default Notification Frequency</InputLabel>
                    <Select
                      value={settings.notifications.defaultNotificationFrequency}
                      label="Default Notification Frequency"
                      onChange={(e) => updateSetting('notifications', 'defaultNotificationFrequency', e.target.value)}
                    >
                      <MenuItem value="immediate">Immediate</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.quietHoursEnabled}
                        onChange={(e) => updateSetting('notifications', 'quietHoursEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Quiet Hours"
                  />
                  {settings.notifications.quietHoursEnabled && (
                    <>
                      <TextField
                        fullWidth
                        label="Quiet Hours Start"
                        type="time"
                        value={settings.notifications.quietHoursStart}
                        onChange={(e) => updateSetting('notifications', 'quietHoursStart', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        fullWidth
                        label="Quiet Hours End"
                        type="time"
                        value={settings.notifications.quietHoursEnd}
                        onChange={(e) => updateSetting('notifications', 'quietHoursEnd', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Performance Settings"
                avatar={<PerformanceIcon />}
              />
              <CardContent>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.performance.enableCaching}
                        onChange={(e) => updateSetting('performance', 'enableCaching', e.target.checked)}
                      />
                    }
                    label="Enable Caching"
                  />
                  <TextField
                    fullWidth
                    label="Cache Timeout (seconds)"
                    type="number"
                    value={settings.performance.cacheTimeout}
                    onChange={(e) => updateSetting('performance', 'cacheTimeout', parseInt(e.target.value))}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.performance.enableCompression}
                        onChange={(e) => updateSetting('performance', 'enableCompression', e.target.checked)}
                      />
                    }
                    label="Enable Compression"
                  />
                  <TextField
                    fullWidth
                    label="Max Upload Size (MB)"
                    type="number"
                    value={settings.performance.maxUploadSize}
                    onChange={(e) => updateSetting('performance', 'maxUploadSize', parseInt(e.target.value))}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.performance.enableCDN}
                        onChange={(e) => updateSetting('performance', 'enableCDN', e.target.checked)}
                      />
                    }
                    label="Enable CDN"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Business Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Business Information"
                avatar={<BusinessIcon />}
              />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={settings.business.companyName}
                    onChange={(e) => updateSetting('business', 'companyName', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Company Address"
                    value={settings.business.companyAddress}
                    onChange={(e) => updateSetting('business', 'companyAddress', e.target.value)}
                    multiline
                    rows={2}
                  />
                  <TextField
                    fullWidth
                    label="Company Phone"
                    value={settings.business.companyPhone}
                    onChange={(e) => updateSetting('business', 'companyPhone', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Company Website"
                    value={settings.business.companyWebsite}
                    onChange={(e) => updateSetting('business', 'companyWebsite', e.target.value)}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.business.enableMaintenanceMode}
                        onChange={(e) => updateSetting('business', 'enableMaintenanceMode', e.target.checked)}
                      />
                    }
                    label="Enable Maintenance Mode"
                  />
                  {settings.business.enableMaintenanceMode && (
                    <TextField
                      fullWidth
                      label="Maintenance Message"
                      value={settings.business.maintenanceMessage}
                      onChange={(e) => updateSetting('business', 'maintenanceMessage', e.target.value)}
                      multiline
                      rows={3}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Test Email Dialog */}
        <Dialog open={testEmailDialogOpen} onClose={() => setTestEmailDialogOpen(false)}>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogContent>
            <Typography>
              This will send a test email to verify your email configuration is working correctly.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTestEmail} variant="contained">Send Test Email</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
};

export default AdminSettingsPage; 