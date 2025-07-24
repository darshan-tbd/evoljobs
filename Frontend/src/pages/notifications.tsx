import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Alert,
  Divider,
  Badge,
  Paper,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Skeleton,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  Circle as UnreadIcon,
  DoneAll as ReadAllIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import useNotificationSocket from '../hooks/useNotificationSocket';
import NotificationToast from '../components/NotificationToast';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  
  // Real-time WebSocket connection
  const { isConnected, lastNotification, connectionStatus } = useNotificationSocket(user?.id);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/notifications/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.results || data);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time notification updates
  useEffect(() => {
    if (lastNotification) {
      setNotifications(prev => {
        // Check if notification already exists to avoid duplicates
        const exists = prev.some(n => n.id === lastNotification.id);
        if (!exists) {
          return [lastNotification, ...prev];
        }
        return prev;
      });
    }
  }, [lastNotification]);

  // Initial data load
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_alert':
      case 'job_recommendation':
        return <WorkIcon color="primary" />;
      case 'application_update':
      case 'interview_invitation':
        return <PersonIcon color="info" />;
      case 'security':
        return <SecurityIcon color="error" />;
      case 'system':
      case 'test':
        return <SettingsIcon color="warning" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'job_alert':
      case 'job_recommendation':
        return 'primary';
      case 'application_update':
      case 'interview_invitation':
        return 'info';
      case 'security':
        return 'error';
      case 'system':
      case 'test':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getFilteredNotifications = () => {
    switch (selectedTab) {
      case 0: // All
        return notifications;
      case 1: // Unread
        return notifications.filter(n => !n.is_read);
      case 2: // Job Alerts
        return notifications.filter(n => n.notification_type === 'job_alert');
      case 3: // Applications
                  return notifications.filter(n => n.notification_type === 'application_update');
      default:
        return notifications;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
    handleMenuClose();
  };

  const handleNotificationClick = (notification: Notification) => {
          if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notificationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

      const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Layout>
        <ProtectedRoute>
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="text" width={300} height={40} />
              <Skeleton variant="text" width={500} height={25} />
            </Box>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2 }} />
            ))}
          </Container>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedRoute>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h4" component="h1">
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              )}
            </Box>
            <Typography variant="h6" color="textSecondary">
              Stay updated with your job applications and new opportunities
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ReadAllIcon />}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All as Read
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => router.push('/settings')}
            >
              Notification Settings
            </Button>
          </Box>

          {/* Filter Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={selectedTab}
              onChange={(_, newValue) => setSelectedTab(newValue)}
              sx={{ px: 2 }}
            >
              <Tab label={`All (${notifications.length})`} />
              <Tab label={`Unread (${unreadCount})`} />
                              <Tab label={`Job Alerts (${notifications.filter(n => n.notification_type === 'job_alert').length})`} />
                <Tab label={`Applications (${notifications.filter(n => n.notification_type === 'application_update').length})`} />
            </Tabs>
          </Paper>

          {/* Notifications List */}
          {getFilteredNotifications().length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No notifications found
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {selectedTab === 0
                  ? "You don't have any notifications yet."
                  : "No notifications match the selected filter."}
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/jobs')}
                startIcon={<WorkIcon />}
              >
                Browse Jobs
              </Button>
            </Paper>
          ) : (
            <Card>
              <List>
                {getFilteredNotifications().map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      button
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Badge
                          variant="dot"
                          color="error"
                          invisible={notification.is_read}
                        >
                                                      {getNotificationIcon(notification.notification_type)}
                        </Badge>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: notification.is_read ? 'normal' : 'bold',
                                flex: 1
                              }}
                            >
                              {notification.title}
                            </Typography>
                            <Chip
                                                              label={notification.notification_type.replace('_', ' ')}
                              size="small"
                                                              color={getNotificationColor(notification.notification_type) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 0.5 }}
                            >
                              {notification.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                            >
                              {formatTimeAgo(notification.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, notification.id)}
                          size="small"
                        >
                          <MoreIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {index < getFilteredNotifications().length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          )}

          {/* Context Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {selectedNotification && (
              <>
                <MenuItem
                  onClick={() => {
                    if (selectedNotification) {
                      markAsRead(selectedNotification);
                    }
                    handleMenuClose();
                  }}
                >
                  <ListItemIcon>
                    <CheckIcon fontSize="small" />
                  </ListItemIcon>
                  Mark as Read
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (selectedNotification) {
                      deleteNotification(selectedNotification);
                    }
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  Delete
                </MenuItem>
              </>
            )}
          </Menu>
        </Container>

        {/* Real-time connection status */}
        {user && (
          <Box
            position="fixed"
            bottom={16}
            left={16}
            bgcolor={isConnected ? 'success.main' : 'error.main'}
            color="white"
            px={2}
            py={1}
            borderRadius={2}
            fontSize="0.8rem"
            sx={{ zIndex: 9999 }}
          >
            WebSocket: {connectionStatus} {isConnected ? '🟢' : '🔴'}
          </Box>
        )}

        {/* Real-time notification toasts */}
        <NotificationToast 
          userId={user?.id} 
          position="top-right"
          autoHideDuration={6000}
          showConnectionStatus={false}
        />
      </ProtectedRoute>
    </Layout>
  );
};

export default NotificationsPage; 