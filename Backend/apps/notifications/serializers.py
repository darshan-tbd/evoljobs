from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Notification, NotificationPreference, NotificationTemplate,
    NotificationChannel, NotificationDelivery
)

User = get_user_model()

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    time_since_created = serializers.SerializerMethodField()
    is_actionable = serializers.BooleanField(read_only=True)
    content_object_type = serializers.SerializerMethodField()
    content_object_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_email', 'notification_type', 'title', 'message',
            'priority', 'is_read', 'read_at', 'is_dismissed', 'dismissed_at',
            'action_url', 'action_label', 'is_actionable', 'metadata',
            'is_sent', 'sent_at', 'delivery_method', 'expires_at',
            'content_object_type', 'content_object_id', 'time_since_created',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'is_sent', 'sent_at', 'created_at', 'updated_at'
        ]
    
    def get_time_since_created(self, obj):
        """Get human-readable time since creation"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes}m ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours}h ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days}d ago"
        else:
            return obj.created_at.strftime('%b %d, %Y')
    
    def get_content_object_type(self, obj):
        """Get content object type name"""
        if obj.content_type:
            return obj.content_type.model
        return None
    
    def get_content_object_id(self, obj):
        """Get content object ID"""
        return str(obj.object_id) if obj.object_id else None

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for NotificationPreference model
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'user_email',
            # Email preferences
            'email_job_alerts', 'email_application_updates', 'email_interview_invitations',
            'email_job_recommendations', 'email_profile_reminders', 'email_weekly_digest',
            'email_newsletter',
            # Real-time preferences
            'realtime_job_alerts', 'realtime_application_updates', 'realtime_interview_invitations',
            'realtime_job_recommendations', 'realtime_messages', 'realtime_system_notifications',
            # Frequency settings
            'job_alert_frequency', 'digest_frequency',
            # Quiet hours
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

class NotificationTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for NotificationTemplate model
    """
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'notification_type', 'title_template', 'message_template',
            'action_label_template', 'action_url_template', 'default_priority',
            'default_delivery_method', 'expires_in_hours', 'available_variables',
            'created_at', 'updated_at'
        ]

class NotificationChannelSerializer(serializers.ModelSerializer):
    """
    Serializer for NotificationChannel model
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    connection_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationChannel
        fields = [
            'id', 'user', 'user_email', 'channel_name', 'connected_at',
            'last_seen', 'is_active', 'user_agent', 'ip_address',
            'connection_duration', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_connection_duration(self, obj):
        """Get connection duration in human-readable format"""
        from django.utils import timezone
        
        if not obj.is_active:
            return "Disconnected"
        
        duration = timezone.now() - obj.connected_at
        hours = int(duration.total_seconds() / 3600)
        minutes = int((duration.total_seconds() % 3600) / 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"

class NotificationDeliverySerializer(serializers.ModelSerializer):
    """
    Serializer for NotificationDelivery model
    """
    notification_title = serializers.CharField(source='notification.title', read_only=True)
    user_email = serializers.EmailField(source='notification.user.email', read_only=True)
    
    class Meta:
        model = NotificationDelivery
        fields = [
            'id', 'notification', 'notification_title', 'user_email',
            'delivery_method', 'status', 'sent_at', 'delivered_at', 'failed_at',
            'error_message', 'retry_count', 'max_retries', 'delivery_metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class NotificationBulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk notification actions
    """
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="List of notification IDs to perform action on"
    )
    action = serializers.ChoiceField(
        choices=['mark_read', 'mark_unread', 'dismiss'],
        help_text="Action to perform on selected notifications"
    )

class NotificationCreateSerializer(serializers.Serializer):
    """
    Serializer for creating notifications via API
    """
    user_id = serializers.IntegerField(help_text="Target user ID")
    notification_type = serializers.ChoiceField(
        choices=Notification.NOTIFICATION_TYPES,
        help_text="Type of notification"
    )
    title = serializers.CharField(max_length=255, help_text="Notification title")
    message = serializers.CharField(help_text="Notification message")
    priority = serializers.ChoiceField(
        choices=Notification.PRIORITY_LEVELS,
        default='medium',
        help_text="Notification priority"
    )
    action_url = serializers.URLField(required=False, allow_blank=True, help_text="Action URL")
    action_label = serializers.CharField(
        required=False, 
        allow_blank=True, 
        max_length=100, 
        help_text="Action button label"
    )
    metadata = serializers.JSONField(
        required=False, 
        default=dict, 
        help_text="Additional metadata"
    )
    delivery_method = serializers.ChoiceField(
        choices=[('realtime', 'Real-time'), ('email', 'Email'), ('both', 'Both')],
        default='realtime',
        help_text="Delivery method"
    )
    expires_in_hours = serializers.IntegerField(
        required=False, 
        allow_null=True, 
        help_text="Expiration time in hours"
    )

class NotificationStatsSerializer(serializers.Serializer):
    """
    Serializer for notification statistics
    """
    total_notifications = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    notifications_24h = serializers.IntegerField()
    active_channels = serializers.IntegerField()
    notification_types = serializers.ListField(
        child=serializers.DictField()
    )
    delivery_stats = serializers.DictField()
    user_engagement = serializers.DictField()

class NotificationFilterSerializer(serializers.Serializer):
    """
    Serializer for notification filtering
    """
    notification_type = serializers.ChoiceField(
        choices=Notification.NOTIFICATION_TYPES,
        required=False,
        help_text="Filter by notification type"
    )
    priority = serializers.ChoiceField(
        choices=Notification.PRIORITY_LEVELS,
        required=False,
        help_text="Filter by priority"
    )
    is_read = serializers.BooleanField(
        required=False,
        help_text="Filter by read status"
    )
    is_dismissed = serializers.BooleanField(
        required=False,
        help_text="Filter by dismissed status"
    )
    created_after = serializers.DateTimeField(
        required=False,
        help_text="Filter notifications created after this date"
    )
    created_before = serializers.DateTimeField(
        required=False,
        help_text="Filter notifications created before this date"
    ) 