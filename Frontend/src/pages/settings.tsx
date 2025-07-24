import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon,
  Language as LanguageIcon,
  DeleteForever as DeleteIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    jobAlerts: true,
    marketingEmails: false,
    darkMode: false,
    language: 'en',
    autoSave: true,
    twoFactorAuth: false,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSettingChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword,
        }),
      });

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setPasswordChangeOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/delete-account/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Logout and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/');
      } else {
        setError('Failed to delete account. Please try again.');
      }
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Layout>
      <ProtectedRoute>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Settings
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Manage your account preferences and security settings
            </Typography>
          </Box>

          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Notification Settings */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <NotificationsIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Notification Preferences</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Receive notifications about your applications"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.emailNotifications}
                              onChange={handleSettingChange('emailNotifications')}
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText
                        primary="Job Alerts"
                        secondary="Get notified about new job opportunities"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.jobAlerts}
                              onChange={handleSettingChange('jobAlerts')}
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText
                        primary="Marketing Emails"
                        secondary="Receive updates and promotional content"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.marketingEmails}
                              onChange={handleSettingChange('marketingEmails')}
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* App Preferences */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ThemeIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6">App Preferences</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Dark Mode"
                        secondary="Switch to dark theme"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.darkMode}
                              onChange={handleSettingChange('darkMode')}
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText
                        primary="Auto Save"
                        secondary="Automatically save form data"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.autoSave}
                              onChange={handleSettingChange('autoSave')}
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Security Settings */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Security</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <LockIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Change Password"
                        secondary="Update your account password"
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setPasswordChangeOpen(true)}
                        >
                          Change
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText
                        primary="Two-Factor Authentication"
                        secondary="Add an extra layer of security"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.twoFactorAuth}
                              onChange={handleSettingChange('twoFactorAuth')}
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Save Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={saveSettings}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </Grid>

            {/* Danger Zone */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon sx={{ mr: 2, color: 'error.main' }} />
                    <Typography variant="h6" color="error">
                      Danger Zone
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    These actions cannot be undone. Please proceed with caution.
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Password Change Dialog */}
          <Dialog
            open={passwordChangeOpen}
            onClose={() => setPasswordChangeOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Change Password</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPasswordChangeOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={changePassword}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Change Password'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Account Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Delete Account</DialogTitle>
            <DialogContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                This action cannot be undone!
              </Alert>
              <Typography variant="body1">
                Are you sure you want to delete your account? This will permanently remove all your data, including:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="• Your profile information" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Job applications and history" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Saved jobs and preferences" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• All associated data" />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={deleteAccount}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Delete Account'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </ProtectedRoute>
    </Layout>
  );
};

export default SettingsPage; 