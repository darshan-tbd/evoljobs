import React from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Person,
  Business,
  AdminPanelSettings,
  Work,
  Assessment,
  Notifications,
  Settings,
  TrendingUp,
  SupervisorAccount,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import JobRecommendations from '../components/JobRecommendations';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { user, isSuperuser, isStaff, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h4">Loading...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h4">Please log in to access the dashboard</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h4">Loading user data...</Typography>
      </Box>
    );
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'job_seeker':
        return <Person />;
      case 'employer':
        return <Business />;
      case 'admin':
        return <AdminPanelSettings />;
      default:
        return <Person />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'error';
      case 'employer':
        return 'warning';
      case 'job_seeker':
        return 'info';
      default:
        return 'default';
    }
  };

  const getWelcomeMessage = () => {
    if (isSuperuser) {
      return 'Welcome back, Superuser! You have full system access.';
    }
    if (isStaff) {
      return 'Welcome back, Staff member! You have administrative privileges.';
    }
    switch (user.user_type) {
      case 'job_seeker':
        return 'Ready to find your next opportunity?';
      case 'employer':
        return 'Ready to find your next great hire?';
      case 'admin':
        return 'System administration dashboard';
      default:
        return 'Welcome to your dashboard!';
    }
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (user.user_type === 'job_seeker' || !user.user_type) {
      actions.push(
        { icon: <Work />, label: 'Browse Jobs', action: () => {
          // Use window.location.href for more reliable navigation
          window.location.href = '/jobs';
        }},
        { icon: <Person />, label: 'Update Profile', action: () => router.push('/profile') },
        { icon: <Assessment />, label: 'Application Status', action: () => router.push('/applications') },
      );
    }
    
    if (user.user_type === 'employer') {
      actions.push(
        { icon: <Business />, label: 'Post New Job', action: () => {} },
        { icon: <Assessment />, label: 'View Applications', action: () => {} },
        { icon: <TrendingUp />, label: 'Analytics', action: () => {} },
      );
    }
    
    if (isSuperuser || isStaff) {
      actions.push(
        { icon: <SupervisorAccount />, label: 'Admin Panel', action: () => {} },
        { icon: <Security />, label: 'User Management', action: () => {} },
        { icon: <Assessment />, label: 'System Reports', action: () => {} },
      );
    }
    
    actions.push(
      { icon: <Settings />, label: 'Settings', action: () => router.push('/settings') },
      { icon: <Notifications />, label: 'Notifications', action: () => router.push('/notifications') },
    );
    
    return actions;
  };

  return (
    <ProtectedRoute>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container spacing={3}>
          {/* Welcome Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                  {user.first_name?.[0] || user.email?.[0] || 'U'}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" gutterBottom>
                    Welcome back, {user.first_name || user.email?.split('@')[0] || 'User'}!
                  </Typography>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    {getWelcomeMessage()}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip
                      icon={getUserTypeIcon(user.user_type || 'job_seeker')}
                      label={(user.user_type || 'job_seeker').replace('_', ' ').toUpperCase()}
                      color={getUserTypeColor(user.user_type || 'job_seeker')}
                    />
                    {isSuperuser && (
                      <Chip
                        icon={<SupervisorAccount />}
                        label="SUPERUSER"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                    {isStaff && !isSuperuser && (
                      <Chip
                        icon={<SupervisorAccount />}
                        label="STAFF"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <List>
                  {getQuickActions().map((action, index) => (
                    <React.Fragment key={index}>
                      <ListItem button onClick={action.action}>
                        <ListItemIcon>
                          {action.icon}
                        </ListItemIcon>
                        <ListItemText primary={action.label} />
                      </ListItem>
                      {index < getQuickActions().length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText
                      primary="Profile Updated"
                      secondary="2 hours ago"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText
                      primary="New Notification"
                      secondary="1 day ago"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Work />
                    </ListItemIcon>
                    <ListItemText
                      primary="Account Created"
                      secondary={user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* User Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{user.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Member Since
                    </Typography>
                    <Typography variant="body1">
                      {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Account Status
                    </Typography>
                    <Chip
                      label={user.is_active !== false ? 'Active' : 'Inactive'}
                      color={user.is_active !== false ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Email Verified
                    </Typography>
                    <Chip
                      label={user.is_verified === true ? 'Verified' : 'Not Verified'}
                      color={user.is_verified === true ? 'success' : 'warning'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Job Recommendations for Job Seekers */}
          {(user.user_type === 'job_seeker' || !user.user_type) && (
            <Grid item xs={12}>
              <JobRecommendations />
            </Grid>
          )}
        </Grid>
      </Box>
    </ProtectedRoute>
  );
};

export default Dashboard; 