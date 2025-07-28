from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.db import models
from .models import JobPosting, JobAlert
from apps.notifications.services import NotificationService
import logging

User = get_user_model()
logger = logging.getLogger(__name__)
notification_service = NotificationService()

@receiver(post_save, sender=JobPosting)
def create_job_notifications(sender, instance, created, **kwargs):
    """
    Create notifications when new jobs are posted
    """
    if not created or instance.status != 'active':
        return
    
    try:
        # Find users with matching job alerts
        matching_alerts = JobAlert.objects.filter(
            is_active=True,
            user__is_active=True
        )
        
        # Filter alerts based on job criteria
        if instance.job_type:
            matching_alerts = matching_alerts.filter(
                models.Q(job_type='') | models.Q(job_type=instance.job_type)
            )
        
        if instance.experience_level:
            matching_alerts = matching_alerts.filter(
                models.Q(experience_level='') | models.Q(experience_level=instance.experience_level)
            )
        
        if instance.remote_option:
            matching_alerts = matching_alerts.filter(
                models.Q(remote_option='') | models.Q(remote_option=instance.remote_option)
            )
        
        if instance.location:
            matching_alerts = matching_alerts.filter(
                models.Q(location__isnull=True) | models.Q(location=instance.location)
            )
        
        # Check salary requirements
        if instance.salary_min:
            matching_alerts = matching_alerts.filter(
                models.Q(salary_min__isnull=True) | models.Q(salary_min__lte=instance.salary_min)
            )
        
        # Check keywords
        alerts_with_keywords = matching_alerts.exclude(keywords='')
        alerts_without_keywords = matching_alerts.filter(keywords='')
        
        keyword_matched_alerts = []
        for alert in alerts_with_keywords:
            keywords = [k.strip().lower() for k in alert.keywords.split(',')]
            job_text = f"{instance.title} {instance.description}".lower()
            
            if any(keyword in job_text for keyword in keywords):
                keyword_matched_alerts.append(alert)
        
        # Combine alerts
        final_alerts = list(alerts_without_keywords) + keyword_matched_alerts
        
        # Create notifications for matching users
        notified_users = set()
        for alert in final_alerts:
            if alert.user_id not in notified_users:
                notification_service.create_notification(
                    user=alert.user,
                    notification_type='job_alert',
                    title=f'🎯 New Job Alert: {instance.title}',
                    message=f'A new job at {instance.company.name} matches your alert "{alert.name}". Check it out now!',
                    priority='medium',
                    content_object=instance,
                    action_url=f'/jobs/{instance.slug}',
                    action_label='View Job',
                    metadata={
                        'job_id': str(instance.id),
                        'job_title': instance.title,
                        'company_name': instance.company.name,
                        'alert_name': alert.name
                    }
                )
                notified_users.add(alert.user_id)
        
        logger.info(f"Created {len(notified_users)} job alert notifications for job: {instance.title}")
        
        # Also create a general job recommendation for active users (optional)
        if instance.is_featured:
            # Notify users who might be interested (simplified example)
            recent_active_users = User.objects.filter(
                is_active=True,
                last_login__isnull=False
            ).exclude(
                id__in=notified_users
            )[:50]  # Limit to 50 users
            
            for user in recent_active_users:
                notification_service.create_notification(
                    user=user,
                    notification_type='job_recommendation',
                    title=f'🌟 Featured Job: {instance.title}',
                    message=f'Check out this featured opportunity at {instance.company.name}!',
                    priority='low',
                    content_object=instance,
                    action_url=f'/jobs/{instance.slug}',
                    action_label='View Job',
                    metadata={
                        'job_id': str(instance.id),
                        'job_title': instance.title,
                        'company_name': instance.company.name,
                        'is_featured': True
                    }
                )
            
            logger.info(f"Created {len(recent_active_users)} featured job notifications")
            
    except Exception as e:
        logger.error(f"Error creating job notifications: {str(e)}")

@receiver(post_save, sender=JobPosting)
def update_job_counts(sender, instance, created, **kwargs):
    """
    Update job counts and metrics
    """
    if created and instance.status == 'active':
        # Update company job count if the field exists
        try:
            instance.company.active_jobs_count = JobPosting.objects.filter(
                company=instance.company,
                status='active',
                is_deleted=False
            ).count()
            instance.company.save(update_fields=['active_jobs_count'])
        except (AttributeError, ValueError):
            # Company model doesn't have active_jobs_count field
            pass 