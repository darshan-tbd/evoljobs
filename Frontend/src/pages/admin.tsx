import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  SupervisorAccount,
  People,
  Business,
  Assessment,
  Settings,
  Security,
  Warning,
  CheckCircle,
  Work,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';

const AdminPage: React.FC = () => {
  const { user, isSuperuser, isStaff } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const adminActions = [
    { 
      icon: <Work />, 
      label: 'Job Management', 
      action: () => router.push('/admin/jobs'),
      description: 'Create, edit, and manage job postings'
    },
    { icon: <People />, label: 'User Management', action: () => {} },
    { icon: <Business />, label: 'Company Management', action: () => {} },
    { icon: <Assessment />, label: 'System Reports', action: () => {} },
    { icon: <Settings />, label: 'System Settings', action: () => {} },
    { icon: <Security />, label: 'Security Logs', action: () => {} },
  ];

  const systemStats = [
    { label: 'Total Users', value: '1,234', color: 'info' },
    { label: 'Active Jobs', value: '567', color: 'success' },
    { label: 'Companies', value: '89', color: 'warning' },
    { label: 'Applications', value: '2,345', color: 'primary' },
  ];

  return (
    <ProtectedRoute requireAuth={true} requireStaff={true}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {isSuperuser && (
              <Chip
                icon={<SupervisorAccount />}
                label="Superuser Access"
                color="secondary"
                variant="outlined"
              />
            )}
            {isStaff && (
              <Chip
                icon={<SupervisorAccount />}
                label="Staff Access"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="body1" color="textSecondary">
            System administration and management console
          </Typography>
        </Box>

        {isSuperuser && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              You have superuser privileges. You can access all system functions and data.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* System Stats */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Statistics
                </Typography>
                <Grid container spacing={2}>
                  {systemStats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {stat.label}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Admin Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Admin Actions
                </Typography>
                <List>
                  {adminActions.map((action, index) => (
                    <React.Fragment key={index}>
                      <ListItem button onClick={action.action}>
                        <ListItemIcon>
                          {action.icon}
                        </ListItemIcon>
                        <ListItemText primary={action.label} />
                      </ListItem>
                      {index < adminActions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* System Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Database Status"
                      secondary="Connected and operational"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="API Status"
                      secondary="All services running"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Background Jobs"
                      secondary="2 jobs in queue"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Storage"
                      secondary="85% available"
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
                  Your Admin Profile
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Name
                    </Typography>
                    <Typography variant="body1">
                      {user.first_name} {user.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{user.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Role
                    </Typography>
                    <Typography variant="body1">
                      {isSuperuser ? 'Superuser' : isStaff ? 'Staff' : 'Admin'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Last Login
                    </Typography>
                    <Typography variant="body1">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ProtectedRoute>
  );
};

export default AdminPage; 