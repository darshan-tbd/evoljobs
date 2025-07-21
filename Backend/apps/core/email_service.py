"""
Email Service for JobPilot (EvolJobs.com)
Handles sending various types of emails including notifications, alerts, and confirmations
"""
import os
import logging
from typing import List, Dict, Optional, Any
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.jobs.models import JobPosting, JobAlert
from apps.companies.models import Company

User = get_user_model()
logger = logging.getLogger(__name__)

class EmailService:
    """
    Service for sending various types of emails
    """
    
    def __init__(self):
        self.from_email = settings.DEFAULT_FROM_EMAIL
        self.reply_to = getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', self.from_email)
        
    def send_welcome_email(self, user: User) -> bool:
        """Send welcome email to new users"""
        try:
            subject = f"Welcome to JobPilot, {user.first_name}!"
            
            context = {
                'user': user,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@jobpilot.com'),
            }
            
            html_content = render_to_string('emails/welcome.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[user.email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending welcome email to {user.email}: {str(e)}")
            return False
    
    def send_job_alert(self, user: User, jobs: List[JobPosting], alert: JobAlert) -> bool:
        """Send job alert email with matching jobs"""
        try:
            if not jobs:
                return True  # No jobs to send
            
            subject = f"New Job Matches: {len(jobs)} job{'s' if len(jobs) != 1 else ''} found"
            
            context = {
                'user': user,
                'jobs': jobs,
                'alert': alert,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'unsubscribe_url': f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/unsubscribe/{alert.id}",
                'job_count': len(jobs),
            }
            
            html_content = render_to_string('emails/job_alert.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[user.email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending job alert to {user.email}: {str(e)}")
            return False
    
    def send_application_confirmation(self, user: User, job: JobPosting, application_data: Dict) -> bool:
        """Send application confirmation email"""
        try:
            subject = f"Application Submitted: {job.title} at {job.company.name}"
            
            context = {
                'user': user,
                'job': job,
                'application_data': application_data,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'application_date': timezone.now(),
            }
            
            html_content = render_to_string('emails/application_confirmation.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[user.email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending application confirmation to {user.email}: {str(e)}")
            return False
    
    def send_employer_application_notification(self, employer_email: str, job: JobPosting, applicant: User) -> bool:
        """Send notification to employer about new application"""
        try:
            subject = f"New Application: {job.title}"
            
            context = {
                'job': job,
                'applicant': applicant,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'application_date': timezone.now(),
            }
            
            html_content = render_to_string('emails/employer_new_application.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[employer_email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending employer notification to {employer_email}: {str(e)}")
            return False
    
    def send_password_reset_email(self, user: User, reset_link: str) -> bool:
        """Send password reset email"""
        try:
            subject = "Reset Your JobPilot Password"
            
            context = {
                'user': user,
                'reset_link': reset_link,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@jobpilot.com'),
            }
            
            html_content = render_to_string('emails/password_reset.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[user.email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending password reset email to {user.email}: {str(e)}")
            return False
    
    def send_profile_completion_reminder(self, user: User, missing_fields: List[str]) -> bool:
        """Send reminder to complete profile"""
        try:
            subject = "Complete Your JobPilot Profile for Better Job Matches"
            
            context = {
                'user': user,
                'missing_fields': missing_fields,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'profile_url': f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/profile",
            }
            
            html_content = render_to_string('emails/profile_completion_reminder.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[user.email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending profile completion reminder to {user.email}: {str(e)}")
            return False
    
    def send_weekly_job_digest(self, user: User, jobs: List[JobPosting], stats: Dict) -> bool:
        """Send weekly job digest email"""
        try:
            subject = "Your Weekly Job Digest - New Opportunities Await"
            
            context = {
                'user': user,
                'jobs': jobs,
                'stats': stats,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'unsubscribe_url': f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/unsubscribe",
            }
            
            html_content = render_to_string('emails/weekly_digest.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[user.email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending weekly digest to {user.email}: {str(e)}")
            return False
    
    def send_interview_invitation(self, applicant: User, job: JobPosting, interview_details: Dict) -> bool:
        """Send interview invitation email"""
        try:
            subject = f"Interview Invitation: {job.title} at {job.company.name}"
            
            context = {
                'applicant': applicant,
                'job': job,
                'interview_details': interview_details,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
            }
            
            html_content = render_to_string('emails/interview_invitation.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[applicant.email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending interview invitation to {applicant.email}: {str(e)}")
            return False
    
    def send_application_status_update(self, applicant: User, job: JobPosting, new_status: str, message: str = "") -> bool:
        """Send application status update email"""
        try:
            status_messages = {
                'reviewing': 'Under Review',
                'interview': 'Interview Scheduled',
                'rejected': 'Application Declined',
                'accepted': 'Congratulations! Application Accepted',
                'withdrawn': 'Application Withdrawn',
            }
            
            status_display = status_messages.get(new_status, new_status.title())
            subject = f"Application Update: {job.title} - {status_display}"
            
            context = {
                'applicant': applicant,
                'job': job,
                'status': new_status,
                'status_display': status_display,
                'message': message,
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
            }
            
            html_content = render_to_string('emails/application_status_update.html', context)
            text_content = strip_tags(html_content)
            
            return self._send_email(
                subject=subject,
                message=text_content,
                recipient_list=[applicant.email],
                html_message=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending status update to {applicant.email}: {str(e)}")
            return False
    
    def send_bulk_email(self, recipients: List[str], subject: str, message: str, html_message: str = None) -> Dict[str, int]:
        """Send bulk email to multiple recipients"""
        try:
            success_count = 0
            failure_count = 0
            
            # Send in batches to avoid overwhelming the email server
            batch_size = 50
            for i in range(0, len(recipients), batch_size):
                batch = recipients[i:i + batch_size]
                
                try:
                    if html_message:
                        msg = EmailMultiAlternatives(
                            subject=subject,
                            body=message,
                            from_email=self.from_email,
                            to=['noreply@jobpilot.com'],  # Use BCC for privacy
                            bcc=batch,
                            reply_to=[self.reply_to]
                        )
                        msg.attach_alternative(html_message, "text/html")
                        msg.send()
                    else:
                        send_mail(
                            subject=subject,
                            message=message,
                            from_email=self.from_email,
                            recipient_list=['noreply@jobpilot.com'],
                            bcc=batch,
                        )
                    
                    success_count += len(batch)
                    
                except Exception as e:
                    logger.error(f"Error sending bulk email batch: {str(e)}")
                    failure_count += len(batch)
            
            return {
                'success': success_count,
                'failures': failure_count,
                'total': len(recipients)
            }
            
        except Exception as e:
            logger.error(f"Error in bulk email sending: {str(e)}")
            return {
                'success': 0,
                'failures': len(recipients),
                'total': len(recipients)
            }
    
    def send_newsletter(self, subscribers: List[User], subject: str, content: str, html_content: str = None) -> Dict[str, int]:
        """Send newsletter to subscribers"""
        try:
            recipient_emails = [user.email for user in subscribers if user.email]
            
            context = {
                'site_name': 'JobPilot',
                'site_url': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'unsubscribe_url': f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/unsubscribe",
                'content': content,
            }
            
            if html_content:
                final_html = render_to_string('emails/newsletter.html', {**context, 'html_content': html_content})
            else:
                final_html = render_to_string('emails/newsletter.html', context)
            
            text_content = strip_tags(final_html)
            
            return self.send_bulk_email(
                recipients=recipient_emails,
                subject=subject,
                message=text_content,
                html_message=final_html
            )
            
        except Exception as e:
            logger.error(f"Error sending newsletter: {str(e)}")
            return {
                'success': 0,
                'failures': len(subscribers),
                'total': len(subscribers)
            }
    
    def _send_email(self, subject: str, message: str, recipient_list: List[str], 
                   html_message: str = None, from_email: str = None) -> bool:
        """Internal method to send email"""
        try:
            if html_message:
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=message,
                    from_email=from_email or self.from_email,
                    to=recipient_list,
                    reply_to=[self.reply_to]
                )
                msg.attach_alternative(html_message, "text/html")
                msg.send()
            else:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=from_email or self.from_email,
                    recipient_list=recipient_list,
                )
            
            logger.info(f"Email sent successfully to {', '.join(recipient_list)}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email to {', '.join(recipient_list)}: {str(e)}")
            return False
    
    def validate_email_settings(self) -> Dict[str, Any]:
        """Validate email configuration"""
        try:
            # Check required settings
            required_settings = [
                'EMAIL_BACKEND',
                'EMAIL_HOST',
                'EMAIL_PORT',
                'DEFAULT_FROM_EMAIL',
            ]
            
            missing_settings = []
            for setting in required_settings:
                if not hasattr(settings, setting) or not getattr(settings, setting):
                    missing_settings.append(setting)
            
            # Test email sending
            test_result = True
            test_error = None
            
            try:
                # Send a test email to a dummy address
                send_mail(
                    subject='JobPilot Email Test',
                    message='This is a test email to validate email configuration.',
                    from_email=self.from_email,
                    recipient_list=['test@example.com'],
                    fail_silently=False,
                )
            except Exception as e:
                test_result = False
                test_error = str(e)
            
            return {
                'valid': len(missing_settings) == 0 and test_result,
                'missing_settings': missing_settings,
                'test_result': test_result,
                'test_error': test_error,
                'current_backend': getattr(settings, 'EMAIL_BACKEND', 'Not configured'),
                'from_email': self.from_email,
                'reply_to': self.reply_to,
            }
            
        except Exception as e:
            return {
                'valid': False,
                'error': str(e),
            }


# Service instance
email_service = EmailService() 