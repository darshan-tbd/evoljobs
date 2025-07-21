import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  Work as JobIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  MarkEmailRead
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  is_read: boolean;
  action_url?: string;
  action_label?: string;
  is_actionable: boolean;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  userId?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = memo(({ userId }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const open = Boolean(anchorEl);

  // WebSocket connection management with optimized heartbeat
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/ws/notifications/`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Notification WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
        
        // Optimized heartbeat - less frequent and doesn't trigger renders
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 60000); // Reduced frequency to 60 seconds
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only process non-heartbeat messages to prevent unnecessary renders
          if (data.type !== 'heartbeat_ack') {
            handleWebSocketMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Notification WebSocket disconnected', event);
        setConnectionStatus('disconnected');
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
        setError('Connection error');
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to connect');
      setConnectionStatus('disconnected');
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect...');
      connectWebSocket();
    }, 5000); // Reconnect after 5 seconds
  }, [connectWebSocket]);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'initial_data':
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
        break;
        
      case 'notification':
        const newNotification = data.data;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico',
            tag: newNotification.id
          });
        }
        break;
        
      case 'unread_count_update':
      case 'unread_count':
        setUnreadCount(data.count);
        break;
        
      case 'heartbeat_ack':
        // Heartbeat acknowledged - don't trigger re-render
        break;
        
      case 'error':
        console.error('WebSocket error:', data.message);
        setError(data.message);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000); // Clean close
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [connectWebSocket]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'mark_notification_read',
          notification_id: notificationId
        }));
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'mark_all_read'
        }));
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'dismiss_notification',
          notification_id: notificationId
        }));
      }
      
      // Update local state
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_alert':
      case 'job_recommendation':
        return <JobIcon color="primary" />;
      case 'application_update':
      case 'interview_invitation':
        return <EmailIcon color="success" />;
      case 'profile_reminder':
        return <PersonIcon color="warning" />;
      default:
        return <NotificationsIcon color="info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      default:
        return 'default';
    }
  };

  const handleNotificationAction = (notification: Notification) => {
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    markNotificationAsRead(notification.id);
    handleClose();
  };

  const ConnectionStatusIndicator = () => {
    if (connectionStatus === 'connected') return null;
    
    return (
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Alert 
          severity={connectionStatus === 'connecting' ? 'info' : 'warning'}
          size="small"
        >
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          {connectionStatus === 'connecting' && (
            <CircularProgress size={16} sx={{ ml: 1 }} />
          )}
        </Alert>
      </Box>
    );
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {connectionStatus === 'connected' && unreadCount > 0 ? (
            <NotificationsActive />
          ) : (
            <NotificationsIcon />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: '90vw',
            maxHeight: 600,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                sx={{ color: 'primary.contrastText' }}
              >
                <MarkEmailRead sx={{ mr: 1 }} />
                Mark All Read
              </Button>
            )}
          </Box>
        </Box>

        <ConnectionStatusIndicator />

        {/* Notifications List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box p={3} textAlign="center">
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.slice(0, 20).map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                      borderLeft: notification.is_read ? 'none' : '4px solid',
                      borderColor: `${getPriorityColor(notification.priority)}.main`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleNotificationAction(notification)}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.notification_type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="subtitle2" component="div">
                            {notification.title}
                          </Typography>
                          <Box display="flex" gap={0.5} ml={1}>
                            {!notification.is_read && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markNotificationAsRead(notification.id);
                                }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {notification.message}
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </Typography>
                            <Box display="flex" gap={0.5}>
                              <Chip
                                label={notification.priority}
                                size="small"
                                color={getPriorityColor(notification.priority) as any}
                                variant="outlined"
                              />
                              {notification.is_actionable && (
                                <Chip
                                  label={notification.action_label || 'View'}
                                  size="small"
                                  variant="filled"
                                  color="primary"
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{ p: 1, bgcolor: 'background.default', textAlign: 'center' }}>
            <Button
              size="small"
              onClick={() => {
                window.location.href = '/notifications';
                handleClose();
              }}
            >
              View All Notifications
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
});

export default NotificationCenter; 