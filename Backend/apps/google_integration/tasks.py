"""
Celery tasks for Google Integration in JobPilot (EvolJobs.com)
Handles automated job applications and email response monitoring
"""

import logging
from typing import Dict, List
from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from .models import GoogleIntegration, AutoApplySession, EmailSentRecord
from .services import GmailAPIService, AutoApplyService

User = get_user_model()
logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def execute_auto_apply_session(self, session_id: str):
    """
    Execute an automated job application session
    """
    try:
        session = AutoApplySession.objects.get(session_id=session_id)
        
        if session.status != 'running':
            logger.warning(f"Session {session_id} is not in running state: {session.status}")
            return
        
        # Execute auto-apply
        auto_apply_service = AutoApplyService(session.google_integration)
        results = auto_apply_service.execute_auto_apply_session(session)
        
        logger.info(f"Auto-apply session {session_id} completed: {results}")
        return results
        
    except AutoApplySession.DoesNotExist:
        logger.error(f"Auto-apply session {session_id} not found")
        return {'error': 'Session not found'}
    
    except Exception as e:
        logger.error(f"Error executing auto-apply session {session_id}: {e}")
        
        try:
            session = AutoApplySession.objects.get(session_id=session_id)
            session.mark_failed(str(e))
        except:
            pass
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(
                countdown=60 * (2 ** self.request.retries),
                exc=e
            )
        
        return {'error': str(e)}

@shared_task(bind=True, max_retries=2)
def trigger_auto_apply_for_user(self, user_id: int, max_applications: int = None, filters: Dict = None):
    """
    Trigger auto-apply for a specific user
    """
    try:
        user = User.objects.get(id=user_id)
        
        # Check if user has Google integration
        try:
            integration = user.google_integration
        except GoogleIntegration.DoesNotExist:
            logger.error(f"User {user.email} does not have Google integration")
            return {'error': 'No Google integration found'}
        
        if not integration.auto_apply_enabled:
            logger.warning(f"Auto-apply disabled for user {user.email}")
            return {'error': 'Auto-apply is disabled'}
        
        if integration.status != 'connected':
            logger.error(f"Google integration not connected for user {user.email}")
            return {'error': 'Google integration not connected'}
        
        # Start auto-apply session
        auto_apply_service = AutoApplyService(integration)
        session = auto_apply_service.start_auto_apply_session(
            max_applications=max_applications,
            search_filters=filters
        )
        
        # Execute session asynchronously
        execute_auto_apply_session.delay(str(session.session_id))
        
        logger.info(f"Auto-apply triggered for user {user.email}, session {session.session_id}")
        return {
            'session_id': str(session.session_id),
            'max_applications': session.max_applications
        }
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return {'error': 'User not found'}
    
    except Exception as e:
        logger.error(f"Error triggering auto-apply for user {user_id}: {e}")
        
        # Retry with delay
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=300, exc=e)  # 5 minutes
        
        return {'error': str(e)}

@shared_task
def check_email_responses_for_integration(integration_id: int):
    """
    Check for email responses for a specific Google integration
    """
    try:
        integration = GoogleIntegration.objects.get(id=integration_id)
        
        if integration.status != 'connected':
            logger.warning(f"Integration {integration_id} not connected, skipping response check")
            return
        
        gmail_service = GmailAPIService(integration)
        responses = gmail_service.check_for_responses()
        
        logger.info(f"Found {len(responses)} new responses for integration {integration_id}")
        return {
            'integration_id': integration_id,
            'responses_found': len(responses),
            'response_ids': [r.id for r in responses]
        }
        
    except GoogleIntegration.DoesNotExist:
        logger.error(f"Google integration {integration_id} not found")
        return {'error': 'Integration not found'}
    
    except Exception as e:
        logger.error(f"Error checking responses for integration {integration_id}: {e}")
        integration = GoogleIntegration.objects.get(id=integration_id)
        integration.record_error(f"Response check error: {str(e)}")
        return {'error': str(e)}

@shared_task
def check_all_email_responses():
    """
    Check for email responses for all active Google integrations
    """
    try:
        # Get all connected integrations
        integrations = GoogleIntegration.objects.filter(
            status='connected',
            auto_apply_enabled=True
        )
        
        results = []
        for integration in integrations:
            try:
                result = check_email_responses_for_integration.delay(integration.id)
                results.append({
                    'integration_id': integration.id,
                    'user_email': integration.user.email,
                    'task_id': result.id
                })
            except Exception as e:
                logger.error(f"Error scheduling response check for integration {integration.id}: {e}")
                results.append({
                    'integration_id': integration.id,
                    'user_email': integration.user.email,
                    'error': str(e)
                })
        
        logger.info(f"Scheduled response checks for {len(results)} integrations")
        return {
            'total_integrations': len(integrations),
            'scheduled_checks': len([r for r in results if 'task_id' in r]),
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error in check_all_email_responses: {e}")
        return {'error': str(e)}

@shared_task
def trigger_daily_auto_apply():
    """
    Trigger auto-apply for all eligible users (daily scheduled task)
    """
    try:
        # Get all users with auto-apply enabled
        integrations = GoogleIntegration.objects.filter(
            status='connected',
            auto_apply_enabled=True
        )
        
        results = []
        for integration in integrations:
            try:
                # Check if user has already reached daily limit
                from apps.subscriptions.services import SubscriptionService
                subscription_service = SubscriptionService()
                
                subscription = subscription_service.get_user_active_subscription(integration.user)
                if not subscription:
                    continue
                
                daily_usage = subscription_service.get_today_usage(integration.user)
                remaining = daily_usage.get_remaining_applications(
                    subscription.plan.daily_application_limit
                )
                
                if remaining <= 0:
                    continue
                
                # Trigger auto-apply
                result = trigger_auto_apply_for_user.delay(
                    integration.user.id,
                    max_applications=remaining,
                    filters=integration.auto_apply_filters
                )
                
                results.append({
                    'user_email': integration.user.email,
                    'task_id': result.id,
                    'max_applications': remaining
                })
                
            except Exception as e:
                logger.error(f"Error triggering auto-apply for user {integration.user.email}: {e}")
                results.append({
                    'user_email': integration.user.email,
                    'error': str(e)
                })
        
        logger.info(f"Triggered daily auto-apply for {len(results)} users")
        return {
            'total_users': len(integrations),
            'triggered_applications': len([r for r in results if 'task_id' in r]),
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error in trigger_daily_auto_apply: {e}")
        return {'error': str(e)}

@shared_task
def refresh_expired_tokens():
    """
    Refresh expired Google access tokens
    """
    try:
        from .services import GoogleOAuthService
        
        # Find integrations with expired tokens
        expired_integrations = GoogleIntegration.objects.filter(
            status='connected',
            token_expires_at__lt=timezone.now()
        )
        
        oauth_service = GoogleOAuthService()
        results = []
        
        for integration in expired_integrations:
            try:
                success = oauth_service.refresh_access_token(integration)
                results.append({
                    'user_email': integration.user.email,
                    'success': success
                })
                
                if success:
                    logger.info(f"Token refreshed for user {integration.user.email}")
                else:
                    logger.warning(f"Failed to refresh token for user {integration.user.email}")
                    
            except Exception as e:
                logger.error(f"Error refreshing token for user {integration.user.email}: {e}")
                results.append({
                    'user_email': integration.user.email,
                    'success': False,
                    'error': str(e)
                })
        
        logger.info(f"Token refresh completed for {len(results)} integrations")
        return {
            'total_processed': len(results),
            'successful_refreshes': len([r for r in results if r.get('success')]),
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error in refresh_expired_tokens: {e}")
        return {'error': str(e)}

@shared_task
def cleanup_old_sessions():
    """
    Cleanup old auto-apply sessions and email records
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=90)  # Keep 90 days
        
        # Cleanup old sessions
        old_sessions = AutoApplySession.objects.filter(created_at__lt=cutoff_date)
        sessions_count = old_sessions.count()
        old_sessions.delete()
        
        # Cleanup old email records (but keep those with responses)
        old_emails = EmailSentRecord.objects.filter(
            sent_at__lt=cutoff_date,
            response_count=0
        )
        emails_count = old_emails.count()
        old_emails.delete()
        
        logger.info(f"Cleanup completed: {sessions_count} sessions, {emails_count} emails")
        return {
            'cleaned_sessions': sessions_count,
            'cleaned_emails': emails_count
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup_old_sessions: {e}")
        return {'error': str(e)}

@shared_task
def send_daily_auto_apply_summary():
    """
    Send daily summary of auto-apply activities to users
    """
    try:
        from apps.notifications.services import NotificationService
        
        # Get yesterday's sessions
        yesterday = timezone.now().date() - timedelta(days=1)
        sessions = AutoApplySession.objects.filter(
            started_at__date=yesterday,
            status='completed'
        )
        
        notification_service = NotificationService()
        results = []
        
        for session in sessions:
            try:
                # Create notification for user
                notification = notification_service.create_notification(
                    user=session.google_integration.user,
                    notification_type='auto_apply_summary',
                    title='Auto-Apply Daily Summary',
                    message=f"Yesterday, {session.applications_sent} applications were sent automatically. "
                           f"{session.applications_failed} applications failed.",
                    priority='low',
                    metadata={
                        'session_id': str(session.session_id),
                        'applications_sent': session.applications_sent,
                        'applications_failed': session.applications_failed,
                        'jobs_found': session.jobs_found
                    },
                    delivery_method='both'
                )
                
                results.append({
                    'user_email': session.google_integration.user.email,
                    'notification_id': notification.id,
                    'applications_sent': session.applications_sent
                })
                
            except Exception as e:
                logger.error(f"Error sending summary for session {session.session_id}: {e}")
                results.append({
                    'user_email': session.google_integration.user.email,
                    'error': str(e)
                })
        
        logger.info(f"Sent daily summaries to {len(results)} users")
        return {
            'total_summaries': len(results),
            'successful_notifications': len([r for r in results if 'notification_id' in r]),
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error in send_daily_auto_apply_summary: {e}")
        return {'error': str(e)} 