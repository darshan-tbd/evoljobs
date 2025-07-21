/**
 * Real-time Notifications Integration Example
 * ==========================================
 * 
 * This example shows how to integrate all the notification components:
 * 1. useNotificationSocket hook for WebSocket connection
 * 2. NotificationToast for showing toast notifications
 * 3. NotificationCenter for notification dropdown
 * 
 * Usage Examples:
 */

import React, { useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import useNotificationSocket from '../hooks/useNotificationSocket';
import NotificationToast from '../components/NotificationToast';
import NotificationCenter from '../components/NotificationCenter';

const NotificationIntegrationExample: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, connectionStatus, lastNotification, reconnect } = useNotificationSocket(user?.id);

  // Example of listening to notifications
  useEffect(() => {
    if (lastNotification) {
      console.log('New notification received:', lastNotification);
      // You can dispatch to Redux, update local state, etc.
    }
  }, [lastNotification]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Real-time Notifications Integration Example
      </Typography>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            WebSocket Connection Status
          </Typography>
          <Typography variant="body1" color={isConnected ? 'success.main' : 'error.main'}>
            Status: {connectionStatus} {isConnected ? '✅' : '❌'}
          </Typography>
          {!isConnected && (
            <Button variant="outlined" onClick={reconnect} sx={{ mt: 1 }}>
              Reconnect
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Last Notification */}
      {lastNotification && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Last Notification Received
            </Typography>
            <Typography variant="subtitle1">
              {lastNotification.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lastNotification.message}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Type: {lastNotification.notification_type} | Priority: {lastNotification.priority}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Usage Examples */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usage Examples
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            1. Basic Hook Usage:
          </Typography>
          <Box component="pre" sx={{ fontSize: '0.8rem', mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
{`import useNotificationSocket from '../hooks/useNotificationSocket';

const MyComponent = () => {
  const { isConnected, lastNotification } = useNotificationSocket(userId);
  
  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      {lastNotification && <div>{lastNotification.title}</div>}
    </div>
  );
};`}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            2. Toast Notifications:
          </Typography>
          <Box component="pre" sx={{ fontSize: '0.8rem', mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
{`import NotificationToast from '../components/NotificationToast';

const App = () => {
  return (
    <div>
      {/* Your app content */}
      
      {/* Add this anywhere in your app */}
      <NotificationToast 
        userId={user?.id} 
        position="top-right"
        autoHideDuration={6000}
        showConnectionStatus={true}
      />
    </div>
  );
};`}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            3. Notification Center (Dropdown):
          </Typography>
          <Box component="pre" sx={{ fontSize: '0.8rem', mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
{`import NotificationCenter from '../components/NotificationCenter';

const Header = () => {
  return (
    <AppBar>
      <Toolbar>
        {/* Other header content */}
        
        {/* Add notification bell */}
        <NotificationCenter userId={user?.id?.toString()} />
        
        {/* User menu, etc. */}
      </Toolbar>
    </AppBar>
  );
};`}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            4. Backend - Send Notification:
          </Typography>
          <Box component="pre" sx={{ fontSize: '0.8rem', p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
{`# In your Django views or services
from apps.notifications.utils import send_user_notification

# Send direct WebSocket message
send_user_notification(user_id, {
    'id': 'notif-123',
    'title': 'New Job Alert',
    'message': 'A new job matches your profile!',
    'notification_type': 'job_alert',
    'priority': 'high',
    'action_url': '/jobs/123',
    'action_label': 'View Job'
})

# Or use the full service
from apps.notifications.services import NotificationService

service = NotificationService()
service.create_notification(
    user=user,
    notification_type='job_alert',
    title='New Job Alert',
    message='A new job matches your profile!',
    priority='high',
    delivery_method='realtime'
)`}
          </Box>
        </CardContent>
      </Card>

      {/* Actual Components Demo */}
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Live Components:
        </Typography>
        
        {/* The notification center in action */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography>Notification Center:</Typography>
          <NotificationCenter userId={user?.id?.toString()} />
        </Box>
      </Box>

      {/* Toast notifications will appear automatically when notifications arrive */}
      <NotificationToast 
        userId={user?.id} 
        position="top-right"
        showConnectionStatus={true}
      />
    </Box>
  );
};

export default NotificationIntegrationExample; 