import logging
from typing import List, Dict, Optional, Any
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import (
    Notification, NotificationPreference, NotificationTemplate, 
    NotificationChannel, NotificationDelivery
)
from apps.core.email_service import EmailService
from .utils import send_user_notification

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service for creating and sending notifications
    """
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
        self.email_service = EmailService()
    
    def create_notification(
        self,
        user: User,
        notification_type: str,
        title: str,
        message: str,
        priority: str = 'medium',
        content_object: Any = None,
        action_url: str = '',
        action_label: str = '',
        metadata: Dict = None,
        delivery_method: str = 'realtime',
        expires_in_hours: Optional[int] = None
    ) -> Notification:
        """
        Create a new notification
        """
        try:
            # Set expiration time
            expires_at = None
            if expires_in_hours:
                expires_at = timezone.now() + timezone.timedelta(hours=expires_in_hours)
            
            # Create notification
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                priority=priority,
                action_url=action_url,
                action_label=action_label,
                metadata=metadata or {},
                delivery_method=delivery_method,
                expires_at=expires_at,
                content_object=content_object
            )
            
            # Send notification based on delivery method
            if delivery_method in ['realtime', 'both']:
                self.send_realtime_notification(notification)
            
            if delivery_method in ['email', 'both']:
                self.send_email_notification(notification)
            
            logger.info(f"Created notification {notification.id} for user {user.email}")
            return notification
            
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            raise
    
    def create_from_template(
        self,
        user: User,
        template_name: str,
        context: Dict,
        content_object: Any = None
    ) -> Notification:
        """
        Create notification from template
        """
        try:
            template = NotificationTemplate.objects.get(name=template_name)
            rendered = template.render(context)
            
            expires_at = None
            if template.expires_in_hours:
                expires_at = timezone.now() + timezone.timedelta(hours=template.expires_in_hours)
            
            notification = Notification.objects.create(
                user=user,
                notification_type=template.notification_type,
                title=rendered['title'],
                message=rendered['message'],
                priority=rendered['priority'],
                action_url=rendered['action_url'],
                action_label=rendered['action_label'],
                delivery_method=rendered['delivery_method'],
                expires_at=expires_at,
                content_object=content_object,
                metadata=context
            )
            
            # Send notification
            if notification.delivery_method in ['realtime', 'both']:
                self.send_realtime_notification(notification)
            
            if notification.delivery_method in ['email', 'both']:
                self.send_email_notification(notification)
            
            return notification
            
        except NotificationTemplate.DoesNotExist:
            logger.error(f"Notification template '{template_name}' not found")
            raise
        except Exception as e:
            logger.error(f"Error creating notification from template: {str(e)}")
            raise
    
    def send_realtime_notification(self, notification: Notification):
        """
        Send real-time notification via WebSocket
        """
        try:
            # Check user preferences
            preferences = self.get_user_preferences(notification.user)
            if not self.should_send_realtime(notification, preferences):
                return
            
            # Prepare notification data
            notification_data = {
                'id': str(notification.id),
                'title': notification.title,
                'message': notification.message,
                'notification_type': notification.notification_type,
                'priority': notification.priority,
                'created_at': notification.created_at.isoformat(),
                'action_url': notification.action_url,
                'action_label': notification.action_label,
                'is_actionable': notification.is_actionable,
                'metadata': notification.metadata
            }
            
            # Send to user's WebSocket group
            user_group_name = f"user_{notification.user.id}"
            
            if self.channel_layer:
                async_to_sync(self.channel_layer.group_send)(
                    user_group_name,
                    {
                        'type': 'send_notification',
                        'notification': notification_data
                    }
                )
                
                # Update unread count
                unread_count = self.get_unread_count(notification.user)
                async_to_sync(self.channel_layer.group_send)(
                    user_group_name,
                    {
                        'type': 'send_unread_count_update',
                        'count': unread_count
                    }
                )
                
                # Create delivery record
                NotificationDelivery.objects.create(
                    notification=notification,
                    delivery_method='realtime',
                    status='sent',
                    sent_at=timezone.now()
                )
                
                logger.info(f"Sent real-time notification {notification.id}")
            
        except Exception as e:
            logger.error(f"Error sending real-time notification: {str(e)}")
            # Create failed delivery record
            NotificationDelivery.objects.create(
                notification=notification,
                delivery_method='realtime',
                status='failed',
                failed_at=timezone.now(),
                error_message=str(e)
            )
    
    def send_email_notification(self, notification: Notification):
        """
        Send email notification
        """
        try:
            # Check user preferences
            preferences = self.get_user_preferences(notification.user)
            if not self.should_send_email(notification, preferences):
                return
            
            # Map notification types to email templates
            email_template_map = {
                'job_alert': 'job_alert',
                'application_update': 'application_status_update',
                'interview_invitation': 'interview_invitation',
                'profile_reminder': 'profile_reminder',
            }
            
            template_name = email_template_map.get(notification.notification_type)
            if not template_name:
                logger.warning(f"No email template for notification type: {notification.notification_type}")
                return
            
            # Prepare email context
            context = {
                'user': notification.user,
                'notification': notification,
                **notification.metadata
            }
            
            # Send email
            success = self.email_service.send_templated_email(
                to_email=notification.user.email,
                template_name=template_name,
                context=context,
                subject=notification.title
            )
            
            # Create delivery record
            if success:
                NotificationDelivery.objects.create(
                    notification=notification,
                    delivery_method='email',
                    status='sent',
                    sent_at=timezone.now()
                )
                logger.info(f"Sent email notification {notification.id}")
            else:
                NotificationDelivery.objects.create(
                    notification=notification,
                    delivery_method='email',
                    status='failed',
                    failed_at=timezone.now(),
                    error_message="Email sending failed"
                )
                
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
            NotificationDelivery.objects.create(
                notification=notification,
                delivery_method='email',
                status='failed',
                failed_at=timezone.now(),
                error_message=str(e)
            )
    
    def bulk_create_notifications(
        self,
        users: List[User],
        notification_type: str,
        title: str,
        message: str,
        **kwargs
    ) -> List[Notification]:
        """
        Create notifications for multiple users
        """
        notifications = []
        
        for user in users:
            try:
                notification = self.create_notification(
                    user=user,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    **kwargs
                )
                notifications.append(notification)
            except Exception as e:
                logger.error(f"Error creating notification for user {user.email}: {str(e)}")
        
        return notifications
    
    def send_job_alert(
        self,
        user: User,
        jobs: List,
        alert_name: str = "Job Alert"
    ):
        """
        Send job alert notification
        """
        job_count = len(jobs)
        
        if job_count == 0:
            return
        
        # Create notification
        notification = self.create_notification(
            user=user,
            notification_type='job_alert',
            title=f"{job_count} New Job Match{'es' if job_count > 1 else ''} Found",
            message=f"We found {job_count} new job{'s' if job_count > 1 else ''} matching your criteria for '{alert_name}'.",
            priority='medium',
            action_url='/jobs',
            action_label='View Jobs',
            metadata={
                'job_count': job_count,
                'alert_name': alert_name,
                'jobs': [{'id': str(job.id), 'title': job.title, 'company': job.company.name} for job in jobs[:5]]
            },
            delivery_method='both'
        )
        
        return notification
    
    def send_application_update(
        self,
        user: User,
        application,
        old_status: str,
        new_status: str
    ):
        """
        Send application status update notification
        """
        status_messages = {
            'reviewing': 'Your application is being reviewed',
            'interview': 'You have been invited for an interview!',
            'accepted': 'Congratulations! Your application has been accepted',
            'rejected': 'Your application status has been updated'
        }
        
        message = status_messages.get(new_status, 'Your application status has been updated')
        priority = 'high' if new_status in ['interview', 'accepted'] else 'medium'
        
        notification = self.create_notification(
            user=user,
            notification_type='application_update',
            title=f"Application Update - {application.job.title}",
            message=message,
            priority=priority,
            content_object=application,
            action_url=f'/applications/{application.id}',
            action_label='View Application',
            metadata={
                'application_id': str(application.id),
                'job_title': application.job.title,
                'company_name': application.job.company.name,
                'old_status': old_status,
                'new_status': new_status
            },
            delivery_method='both'
        )
        
        return notification
    
    def send_job_recommendation(
        self,
        user: User,
        jobs: List,
        reason: str = "Based on your profile"
    ):
        """
        Send job recommendation notification
        """
        job_count = len(jobs)
        
        if job_count == 0:
            return
        
        notification = self.create_notification(
            user=user,
            notification_type='job_recommendation',
            title=f"{job_count} Job Recommendation{'s' if job_count > 1 else ''}",
            message=f"We found {job_count} job{'s' if job_count > 1 else ''} that might interest you. {reason}.",
            priority='medium',
            action_url='/jobs/recommended',
            action_label='View Recommendations',
            metadata={
                'job_count': job_count,
                'reason': reason,
                'jobs': [{'id': str(job.id), 'title': job.title, 'company': job.company.name} for job in jobs[:3]]
            },
            delivery_method='realtime'
        )
        
        return notification
    
    def get_user_preferences(self, user: User) -> NotificationPreference:
        """
        Get or create user notification preferences
        """
        preferences, created = NotificationPreference.objects.get_or_create(
            user=user,
            defaults={}
        )
        return preferences
    
    def should_send_realtime(self, notification: Notification, preferences: NotificationPreference) -> bool:
        """
        Check if real-time notification should be sent based on preferences
        """
        # Check quiet hours
        if preferences.is_quiet_hours():
            return False
        
        # Check specific preference
        preference_map = {
            'job_alert': preferences.realtime_job_alerts,
            'application_update': preferences.realtime_application_updates,
            'interview_invitation': preferences.realtime_interview_invitations,
            'job_recommendation': preferences.realtime_job_recommendations,
            'message': preferences.realtime_messages,
            'system': preferences.realtime_system_notifications,
        }
        
        return preference_map.get(notification.notification_type, True)
    
    def should_send_email(self, notification: Notification, preferences: NotificationPreference) -> bool:
        """
        Check if email notification should be sent based on preferences
        """
        preference_map = {
            'job_alert': preferences.email_job_alerts,
            'application_update': preferences.email_application_updates,
            'interview_invitation': preferences.email_interview_invitations,
            'job_recommendation': preferences.email_job_recommendations,
            'profile_reminder': preferences.email_profile_reminders,
        }
        
        return preference_map.get(notification.notification_type, True)
    
    def get_unread_count(self, user: User) -> int:
        """
        Get unread notification count for user
        """
        return Notification.objects.filter(
            user=user,
            is_read=False,
            is_dismissed=False
        ).exclude(
            expires_at__lt=timezone.now()
        ).count()
    
    def mark_all_as_read(self, user: User) -> int:
        """
        Mark all notifications as read for user
        """
        updated = Notification.objects.filter(
            user=user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        # Send updated count to WebSocket
        if self.channel_layer and updated > 0:
            user_group_name = f"user_{user.id}"
            async_to_sync(self.channel_layer.group_send)(
                user_group_name,
                {
                    'type': 'send_unread_count_update',
                    'count': 0
                }
            )
        
        return updated
    
    def cleanup_expired_notifications(self):
        """
        Clean up expired notifications
        """
        expired_count = Notification.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()[0]
        
        logger.info(f"Cleaned up {expired_count} expired notifications")
        return expired_count
    
    def cleanup_inactive_channels(self, hours: int = 24):
        """
        Clean up inactive notification channels
        """
        cutoff_time = timezone.now() - timezone.timedelta(hours=hours)
        
        inactive_count = NotificationChannel.objects.filter(
            last_seen__lt=cutoff_time,
            is_active=True
        ).update(is_active=False)
        
        logger.info(f"Marked {inactive_count} channels as inactive")
        return inactive_count

# Create global instance
notification_service = NotificationService() 