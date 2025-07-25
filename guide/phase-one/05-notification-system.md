# Real-time Notification System

##  Notification System Overview

JobPilot features a comprehensive real-time notification system that keeps users engaged and informed about important events, job opportunities, and application updates through multiple delivery channels.

##  System Architecture

### WebSocket-Based Real-time Delivery
`
Frontend (React)
     Socket.IO Client
WebSocket Connection
     Django Channels
Backend Notification Service
     Channel Layer
Redis Message Broker
     Database
Notification Storage
`

### Notification Flow
1. **Event Trigger**: User action or system event occurs
2. **Notification Creation**: System creates notification record
3. **Channel Selection**: Determine delivery method (real-time, email, both)
4. **Real-time Delivery**: WebSocket broadcast to connected clients
5. **Email Delivery**: Background task for email notifications
6. **Delivery Tracking**: Monitor and log delivery status

##  Notification Types

### 1. Job-Related Notifications
- **Job Alerts**: New jobs matching saved searches
- **Job Recommendations**: AI-powered job suggestions
- **Job Deadline Reminders**: Application deadlines approaching
- **Salary Alerts**: Jobs with competitive salary offers
- **Skill Match Notifications**: Jobs requiring user's specific skills

### 2. Application Notifications
- **Application Confirmations**: Application successfully submitted
- **Status Updates**: Application status changes (reviewing, shortlisted, etc.)
- **Interview Invitations**: Interview scheduling requests
- **Offer Notifications**: Job offers and next steps
- **Rejection Notifications**: Application rejections with feedback

### 3. Profile & Career Notifications
- **Profile Reminders**: Incomplete profile warnings
- **Skill Gap Alerts**: Missing skills for desired roles
- **Achievement Notifications**: Profile completion milestones
- **Career Insights**: Personalized career development tips

### 4. System Notifications
- **Welcome Messages**: New user onboarding
- **Feature Announcements**: New platform features
- **Maintenance Notices**: System updates and downtime
- **Security Alerts**: Account security notifications

##  Technical Implementation

### Core Notification Model
`python
class Notification(BaseModel):
    NOTIFICATION_TYPES = (
        ('job_alert', 'Job Alert'),
        ('application_update', 'Application Update'),
        ('interview_invitation', 'Interview Invitation'),
        ('job_recommendation', 'Job Recommendation'),
        ('profile_reminder', 'Profile Reminder'),
        ('system', 'System Notification'),
    )
    
    PRIORITY_LEVELS = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    user = ForeignKey(User, on_delete=CASCADE)
    notification_type = CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = CharField(max_length=255)
    message = TextField()
    priority = CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    
    # Status tracking
    is_read = BooleanField(default=False)
    read_at = DateTimeField(null=True, blank=True)
    is_dismissed = BooleanField(default=False)
    
    # Generic relation to any model
    content_type = ForeignKey(ContentType, on_delete=CASCADE, null=True)
    object_id = PositiveIntegerField(null=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Action settings
    action_url = URLField(blank=True)
    action_label = CharField(max_length=100, blank=True)
    metadata = JSONField(default=dict)
    
    # Delivery settings
    delivery_method = CharField(max_length=50, default='realtime')
    expires_at = DateTimeField(null=True, blank=True)
`

### WebSocket Consumer
`python
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return
        
        self.group_name = f"notifications_{self.user.id}"
        
        # Join notification group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send unread notification count
        unread_count = await self.get_unread_count()
        await self.send_notification_count(unread_count)
    
    async def disconnect(self, close_code):
        # Leave notification group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    async def notification_count(self, event):
        """Send unread notification count"""
        await self.send(text_data=json.dumps({
            'type': 'notification_count',
            'count': event['count']
        }))
`

### Notification Service
`python
class NotificationService:
    @staticmethod
    def create_notification(user, notification_type, title, message, **kwargs):
        """Create and deliver notification"""
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=kwargs.get('priority', 'medium'),
            action_url=kwargs.get('action_url', ''),
            action_label=kwargs.get('action_label', ''),
            metadata=kwargs.get('metadata', {}),
            delivery_method=kwargs.get('delivery_method', 'realtime')
        )
        
        # Send real-time notification
        if notification.delivery_method in ['realtime', 'both']:
            NotificationService.send_realtime_notification(notification)
        
        # Queue email notification
        if notification.delivery_method in ['email', 'both']:
            NotificationService.queue_email_notification(notification)
        
        return notification
    
    @staticmethod
    def send_realtime_notification(notification):
        """Send real-time notification via WebSocket"""
        channel_layer = get_channel_layer()
        group_name = f"notifications_{notification.user.id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_message',
                'notification': NotificationSerializer(notification).data
            }
        )
        
        # Update unread count
        unread_count = Notification.objects.filter(
            user=notification.user,
            is_read=False
        ).count()
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_count',
                'count': unread_count
            }
        )
    
    @staticmethod
    def queue_email_notification(notification):
        """Queue email notification for background processing"""
        # Use Celery for background email sending
        send_email_notification.delay(notification.id)
`

##  Frontend Integration

### React WebSocket Hook
`	sx
const useNotificationSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const newSocket = io('/ws/notifications/', {
      auth: {
        token: localStorage.getItem('access_token')
      }
    });
    
    newSocket.on('notification', (data) => {
      const notification = data.notification;
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        action: notification.action_label ? {
          label: notification.action_label,
          onClick: () => window.location.href = notification.action_url
        } : undefined
      });
    });
    
    newSocket.on('notification_count', (data) => {
      setUnreadCount(data.count);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [user]);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(/api/v1/notifications//mark-read/, {
        method: 'POST',
        headers: {
          'Authorization': Bearer 
        }
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    socket
  };
};
`

### Notification Center Component
`	sx
const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useNotificationSocket();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
`

##  Email Notification System

### Email Templates
`python
class NotificationTemplate(BaseModel):
    name = CharField(max_length=100, unique=True)
    notification_type = CharField(max_length=50)
    
    # Template content
    title_template = CharField(max_length=255)
    message_template = TextField()
    action_label_template = CharField(max_length=100, blank=True)
    action_url_template = CharField(max_length=500, blank=True)
    
    # Email-specific templates
    email_subject_template = CharField(max_length=255, blank=True)
    email_html_template = TextField(blank=True)
    email_text_template = TextField(blank=True)
    
    def render_email(self, context):
        """Render email template with context"""
        from django.template import Template, Context
        
        subject = Template(self.email_subject_template).render(Context(context))
        html_content = Template(self.email_html_template).render(Context(context))
        text_content = Template(self.email_text_template).render(Context(context))
        
        return {
            'subject': subject,
            'html_content': html_content,
            'text_content': text_content
        }
`

### Background Email Processing
`python
@shared_task
def send_email_notification(notification_id):
    """Background task for sending email notifications"""
    try:
        notification = Notification.objects.get(id=notification_id)
        user = notification.user
        
        # Check user email preferences
        preferences = getattr(user, 'notification_preferences', None)
        if preferences and not getattr(preferences, f'email_{notification.notification_type}', True):
            return
        
        # Get email template
        template = NotificationTemplate.objects.filter(
            notification_type=notification.notification_type
        ).first()
        
        if not template:
            return
        
        # Render email content
        context = {
            'user': user,
            'notification': notification,
            'site_url': settings.FRONTEND_URL
        }
        email_content = template.render_email(context)
        
        # Send email
        send_mail(
            subject=email_content['subject'],
            message=email_content['text_content'],
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=email_content['html_content']
        )
        
        # Mark as sent
        notification.is_sent = True
        notification.sent_at = timezone.now()
        notification.save()
        
    except Exception as e:
        logger.error(f"Failed to send email notification {notification_id}: {e}")
`

##  User Preferences

### Notification Preferences Model
`python
class NotificationPreference(BaseModel):
    user = OneToOneField(User, on_delete=CASCADE)
    
    # Email preferences
    email_job_alerts = BooleanField(default=True)
    email_application_updates = BooleanField(default=True)
    email_interview_invitations = BooleanField(default=True)
    email_job_recommendations = BooleanField(default=True)
    email_weekly_digest = BooleanField(default=True)
    
    # Real-time preferences
    realtime_job_alerts = BooleanField(default=True)
    realtime_application_updates = BooleanField(default=True)
    realtime_interview_invitations = BooleanField(default=True)
    realtime_messages = BooleanField(default=True)
    
    # Frequency settings
    job_alert_frequency = CharField(max_length=20, choices=[
        ('immediate', 'Immediate'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ], default='immediate')
    
    # Quiet hours
    quiet_hours_enabled = BooleanField(default=False)
    quiet_hours_start = TimeField(null=True, blank=True)
    quiet_hours_end = TimeField(null=True, blank=True)
`

### Preference Management API
`python
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notification_preferences(request):
    """Get or update notification preferences"""
    preferences, created = NotificationPreference.objects.get_or_create(
        user=request.user
    )
    
    if request.method == 'GET':
        serializer = NotificationPreferenceSerializer(preferences)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = NotificationPreferenceSerializer(
            preferences, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
`

##  Analytics & Monitoring

### Notification Analytics
`python
def get_notification_analytics():
    """Get comprehensive notification analytics"""
    total_sent = Notification.objects.count()
    total_read = Notification.objects.filter(is_read=True).count()
    
    # Read rate by type
    read_rates = {}
    for notification_type, _ in Notification.NOTIFICATION_TYPES:
        total_type = Notification.objects.filter(
            notification_type=notification_type
        ).count()
        read_type = Notification.objects.filter(
            notification_type=notification_type,
            is_read=True
        ).count()
        
        if total_type > 0:
            read_rates[notification_type] = (read_type / total_type) * 100
    
    return {
        'total_notifications': total_sent,
        'overall_read_rate': (total_read / total_sent) * 100 if total_sent > 0 else 0,
        'read_rates_by_type': read_rates,
        'active_channels': NotificationChannel.objects.filter(is_active=True).count()
    }
`

### Performance Monitoring
- **Delivery Speed**: WebSocket message delivery time
- **Connection Health**: Active WebSocket connections
- **Email Delivery**: Email send success rates
- **User Engagement**: Notification read and click rates
- **System Load**: Notification processing performance

##  Advanced Features

### Smart Notification Scheduling
- **Optimal Timing**: Send notifications when users are most active
- **Frequency Capping**: Prevent notification overload
- **Personalization**: Customize content based on user behavior
- **A/B Testing**: Test different notification strategies

### Rich Notifications
- **Action Buttons**: Direct actions within notifications
- **Media Content**: Images and rich text formatting
- **Deep Linking**: Direct navigation to specific app sections
- **Contextual Information**: Dynamic content based on user state

### Integration Capabilities
- **Mobile Push**: Native mobile app notifications (planned)
- **Browser Push**: Web push notifications (planned)
- **Third-party Tools**: Slack, Microsoft Teams integration (planned)
- **Webhook Support**: External system notifications (planned)
