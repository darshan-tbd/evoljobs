from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from apps.core.models import BaseModel
from apps.jobs.models import JobPosting
from apps.companies.models import Company

User = get_user_model()

class Notification(BaseModel):
    """
    Model for storing user notifications
    """
    NOTIFICATION_TYPES = (
        ('job_alert', 'Job Alert'),
        ('application_update', 'Application Update'),
        ('interview_invitation', 'Interview Invitation'),
        ('job_recommendation', 'Job Recommendation'),
        ('profile_reminder', 'Profile Reminder'),
        ('message', 'Message'),
        ('system', 'System Notification'),
        ('company_update', 'Company Update'),
        ('skill_match', 'Skill Match'),
        ('salary_alert', 'Salary Alert'),
        ('deadline_reminder', 'Deadline Reminder'),
        ('achievement', 'Achievement'),
        ('newsletter', 'Newsletter'),
    )
    
    PRIORITY_LEVELS = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    # Core fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    
    # Status tracking
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_dismissed = models.BooleanField(default=False)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    
    # Generic foreign key to link to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Action and metadata
    action_url = models.URLField(blank=True, help_text="URL to take action on this notification")
    action_label = models.CharField(max_length=100, blank=True, help_text="Label for action button")
    metadata = models.JSONField(default=dict, help_text="Additional notification data")
    
    # Delivery tracking
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivery_method = models.CharField(max_length=50, default='realtime', choices=[
        ('realtime', 'Real-time'),
        ('email', 'Email'),
        ('both', 'Both'),
    ])
    
    # Expiration
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
            models.Index(fields=['user', 'notification_type']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def mark_as_unread(self):
        """Mark notification as unread"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])
    
    def dismiss(self):
        """Dismiss notification"""
        if not self.is_dismissed:
            self.is_dismissed = True
            self.dismissed_at = timezone.now()
            self.save(update_fields=['is_dismissed', 'dismissed_at'])
    
    def is_expired(self):
        """Check if notification is expired"""
        return self.expires_at and self.expires_at < timezone.now()
    
    @property
    def is_actionable(self):
        """Check if notification has an action"""
        return bool(self.action_url and self.action_label)

class NotificationPreference(BaseModel):
    """
    Model for user notification preferences
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email preferences
    email_job_alerts = models.BooleanField(default=True)
    email_application_updates = models.BooleanField(default=True)
    email_interview_invitations = models.BooleanField(default=True)
    email_job_recommendations = models.BooleanField(default=True)
    email_profile_reminders = models.BooleanField(default=True)
    email_weekly_digest = models.BooleanField(default=True)
    email_newsletter = models.BooleanField(default=True)
    
    # Real-time preferences
    realtime_job_alerts = models.BooleanField(default=True)
    realtime_application_updates = models.BooleanField(default=True)
    realtime_interview_invitations = models.BooleanField(default=True)
    realtime_job_recommendations = models.BooleanField(default=True)
    realtime_messages = models.BooleanField(default=True)
    realtime_system_notifications = models.BooleanField(default=True)
    
    # Frequency settings
    job_alert_frequency = models.CharField(max_length=20, choices=[
        ('immediate', 'Immediate'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ], default='immediate')
    
    digest_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ], default='weekly')
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notification_preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.email}"
    
    def is_quiet_hours(self):
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_enabled or not self.quiet_hours_start or not self.quiet_hours_end:
            return False
        
        current_time = timezone.now().time()
        return self.quiet_hours_start <= current_time <= self.quiet_hours_end

class NotificationTemplate(BaseModel):
    """
    Model for notification templates
    """
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=50, choices=Notification.NOTIFICATION_TYPES)
    
    # Template content
    title_template = models.CharField(max_length=255)
    message_template = models.TextField()
    action_label_template = models.CharField(max_length=100, blank=True)
    action_url_template = models.CharField(max_length=500, blank=True)
    
    # Settings
    default_priority = models.CharField(max_length=20, choices=Notification.PRIORITY_LEVELS, default='medium')
    default_delivery_method = models.CharField(max_length=50, default='realtime')
    expires_in_hours = models.IntegerField(null=True, blank=True, help_text="Hours after which notification expires")
    
    # Template variables help
    available_variables = models.JSONField(default=dict, help_text="Available template variables")
    
    class Meta:
        db_table = 'notification_templates'
    
    def __str__(self):
        return self.name
    
    def render(self, context):
        """Render template with context variables"""
        from django.template import Template, Context
        
        title = Template(self.title_template).render(Context(context))
        message = Template(self.message_template).render(Context(context))
        action_label = Template(self.action_label_template).render(Context(context)) if self.action_label_template else ''
        action_url = Template(self.action_url_template).render(Context(context)) if self.action_url_template else ''
        
        return {
            'title': title,
            'message': message,
            'action_label': action_label,
            'action_url': action_url,
            'priority': self.default_priority,
            'delivery_method': self.default_delivery_method,
        }

class NotificationChannel(BaseModel):
    """
    Model for notification channels (WebSocket connections)
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_channels')
    channel_name = models.CharField(max_length=255, unique=True)
    
    # Connection info
    connected_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Client info
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'notification_channels'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['channel_name']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.channel_name}"
    
    def mark_inactive(self):
        """Mark channel as inactive"""
        self.is_active = False
        self.save(update_fields=['is_active'])

class NotificationDelivery(BaseModel):
    """
    Model for tracking notification deliveries
    """
    DELIVERY_STATUS = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    )
    
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='deliveries')
    delivery_method = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=DELIVERY_STATUS, default='pending')
    
    # Delivery details
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    # Metadata
    delivery_metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'notification_deliveries'
        unique_together = ['notification', 'delivery_method']
    
    def __str__(self):
        return f"{self.notification.title} - {self.delivery_method} ({self.status})"
    
    def mark_as_sent(self):
        """Mark delivery as sent"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
    
    def mark_as_delivered(self):
        """Mark delivery as delivered"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save(update_fields=['status', 'delivered_at'])
    
    def mark_as_failed(self, error_message=''):
        """Mark delivery as failed"""
        self.status = 'failed'
        self.failed_at = timezone.now()
        self.error_message = error_message
        self.retry_count += 1
        self.save(update_fields=['status', 'failed_at', 'error_message', 'retry_count'])
    
    def can_retry(self):
        """Check if delivery can be retried"""
        return self.retry_count < self.max_retries and self.status == 'failed' 