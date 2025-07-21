import React, { useEffect, useState } from 'react';
import { 
  Alert, 
  Snackbar, 
  IconButton, 
  Box, 
  Typography, 
  Button,
  Chip 
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Work as WorkIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import useNotificationSocket from '../hooks/useNotificationSocket';

interface NotificationToastProps {
  userId?: number | string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHideDuration?: number;
  showConnectionStatus?: boolean;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  userId,
  position = 'top-right',
  autoHideDuration = 6000,
  showConnectionStatus = false
}) => {
  const { lastNotification, isConnected, connectionStatus, error } = useNotificationSocket(userId);
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_alert':
      case 'job_recommendation':
        return <WorkIcon />;
      case 'application_update':
      case 'interview_invitation':
        return <PersonIcon />;
      case 'email':
        return <EmailIcon />;
      case 'security':
        return <SecurityIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Get color based on priority
  const getAlertSeverity = (priority: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  // Get position styles
  const getAnchorOrigin = () => {
    switch (position) {
      case 'top-left':
        return { vertical: 'top' as const, horizontal: 'left' as const };
      case 'bottom-left':
        return { vertical: 'bottom' as const, horizontal: 'left' as const };
      case 'bottom-right':
        return { vertical: 'bottom' as const, horizontal: 'right' as const };
      default: // top-right
        return { vertical: 'top' as const, horizontal: 'right' as const };
    }
  };

  // Show toast when new notification arrives
  useEffect(() => {
    if (lastNotification) {
      setCurrentNotification(lastNotification);
      setOpen(true);
    }
  }, [lastNotification]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleActionClick = () => {
    if (currentNotification?.action_url) {
      window.open(currentNotification.action_url, '_blank');
    }
    setOpen(false);
  };

  return (
    <>
      {/* Connection Status Toast (if enabled) */}
      {showConnectionStatus && (
        <Snackbar
          open={!isConnected && connectionStatus !== 'disconnected'}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          autoHideDuration={null}
        >
          <Alert 
            severity={connectionStatus === 'error' ? 'error' : 'warning'}
            action={
              <IconButton size="small" color="inherit">
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {connectionStatus === 'connecting' && 'Connecting to notifications...'}
            {connectionStatus === 'error' && `Connection error: ${error || 'Unknown error'}`}
          </Alert>
        </Snackbar>
      )}

      {/* Notification Toast */}
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={getAnchorOrigin()}
        sx={{ maxWidth: 400 }}
      >
        <Alert
          severity={currentNotification ? getAlertSeverity(currentNotification.priority) : 'info'}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          icon={currentNotification ? getNotificationIcon(currentNotification.notification_type) : undefined}
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          {currentNotification && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {currentNotification.title}
                </Typography>
                <Chip 
                  label={currentNotification.priority.toUpperCase()} 
                  size="small" 
                  color={currentNotification.priority === 'high' || currentNotification.priority === 'urgent' ? 'error' : 'default'}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={1}>
                {currentNotification.message}
              </Typography>

              {currentNotification.action_url && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleActionClick}
                  sx={{ mt: 1 }}
                >
                  {currentNotification.action_label || 'View Details'}
                </Button>
              )}
            </Box>
          )}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationToast; 