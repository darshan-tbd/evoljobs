"""
Google Integration models for JobPilot (EvolJobs.com)
Handles Google OAuth 2.0 integration for automated job applications via Gmail API
"""

import uuid
import json
from typing import Dict, Optional, Any
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from cryptography.fernet import Fernet
from apps.core.models import BaseModel
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class GoogleIntegration(BaseModel):
    """
    Main model for storing Google OAuth integration data per user
    """
    
    STATUS_CHOICES = (
        ('connected', 'Connected'),
        ('disconnected', 'Disconnected'),
        ('expired', 'Token Expired'),
        ('revoked', 'Access Revoked'),
        ('error', 'Error'),
    )
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='google_integration'
    )
    
    # OAuth tokens (encrypted)
    access_token_encrypted = models.TextField(blank=True, default='')
    refresh_token_encrypted = models.TextField(blank=True, default='')
    
    # Token metadata
    token_expires_at = models.DateTimeField(null=True, blank=True)
    scope = models.TextField(default='')  # Space-separated scopes
    
    # Google account info
    google_email = models.EmailField(blank=True)
    google_user_id = models.CharField(max_length=255, blank=True)
    
    # Integration status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disconnected')
    last_sync = models.DateTimeField(null=True, blank=True)
    
    # Auto-apply configuration
    auto_apply_enabled = models.BooleanField(default=False)
    auto_apply_filters = models.JSONField(default=dict, help_text="Job search filters for auto-apply")
    
    # Error tracking
    last_error = models.TextField(blank=True)
    error_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'google_integrations'
    
    def __str__(self):
        return f"{self.user.email} - Google Integration ({self.status})"
    
    @property
    def is_token_valid(self) -> bool:
        """Check if the access token is still valid"""
        if not self.token_expires_at:
            return False
        return timezone.now() < self.token_expires_at
    
    def get_access_token(self) -> Optional[str]:
        """Decrypt and return access token"""
        if not self.access_token_encrypted:
            return None
        try:
            return self._decrypt_token(self.access_token_encrypted)
        except Exception as e:
            logger.error(f"Error decrypting access token for {self.user.email}: {e}")
            return None
    
    def get_refresh_token(self) -> Optional[str]:
        """Decrypt and return refresh token"""
        if not self.refresh_token_encrypted:
            return None
        try:
            return self._decrypt_token(self.refresh_token_encrypted)
        except Exception as e:
            logger.error(f"Error decrypting refresh token for {self.user.email}: {e}")
            return None
    
    def set_tokens(self, access_token: str, refresh_token: str = None, expires_in: int = None):
        """Encrypt and store tokens"""
        try:
            self.access_token_encrypted = self._encrypt_token(access_token)
            if refresh_token:
                self.refresh_token_encrypted = self._encrypt_token(refresh_token)
            else:
                # Explicitly set to empty string if no refresh token
                self.refresh_token_encrypted = ''
            
            if expires_in:
                self.token_expires_at = timezone.now() + timezone.timedelta(seconds=expires_in)
            
            self.status = 'connected'
            self.last_sync = timezone.now()
            self.error_count = 0
            self.last_error = ''
            self.save()
            
        except Exception as e:
            logger.error(f"Error storing tokens for {self.user.email}: {e}")
            self.status = 'error'
            self.last_error = str(e)
            self.save()
    
    def clear_tokens(self):
        """Clear stored tokens"""
        self.access_token_encrypted = ''
        self.refresh_token_encrypted = ''
        self.token_expires_at = None
        self.status = 'disconnected'
        self.google_email = ''
        self.google_user_id = ''
        self.save()
    
    def record_error(self, error: str):
        """Record an error"""
        self.last_error = error
        self.error_count += 1
        if self.error_count >= 5:  # Too many errors, mark as error status
            self.status = 'error'
        self.save()
    
    def _get_encryption_key(self) -> bytes:
        """Get encryption key from settings"""
        key = getattr(settings, 'GOOGLE_TOKEN_ENCRYPTION_KEY', None)
        if not key:
            # Generate a key if not set (for development only)
            key = Fernet.generate_key()
            logger.warning("Using auto-generated encryption key - set GOOGLE_TOKEN_ENCRYPTION_KEY in production")
        
        if isinstance(key, str):
            key = key.encode()
        
        return key
    
    def _encrypt_token(self, token: str) -> str:
        """Encrypt a token"""
        f = Fernet(self._get_encryption_key())
        return f.encrypt(token.encode()).decode()
    
    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt a token"""
        f = Fernet(self._get_encryption_key())
        return f.decrypt(encrypted_token.encode()).decode()


class EmailSentRecord(BaseModel):
    """
    Record of emails sent through Gmail API for job applications
    """
    
    STATUS_CHOICES = (
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
        ('replied', 'Replied'),
    )
    
    google_integration = models.ForeignKey(
        GoogleIntegration, 
        on_delete=models.CASCADE, 
        related_name='sent_emails',
        null=True,
        blank=True
    )
    
    # Job application details
    job = models.ForeignKey('jobs.JobPosting', on_delete=models.CASCADE, null=True, blank=True)
    application = models.ForeignKey('applications.JobApplication', on_delete=models.CASCADE, null=True, blank=True)
    
    # Email details
    gmail_message_id = models.CharField(max_length=255, unique=True)
    to_email = models.EmailField()
    subject = models.CharField(max_length=500)
    
    # Content
    email_body = models.TextField()
    attachments = models.JSONField(default=list, help_text="List of attachment filenames")
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    sent_at = models.DateTimeField(default=timezone.now)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Response tracking
    response_count = models.IntegerField(default=0)
    last_response_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'email_sent_records'
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"Email to {self.to_email} for {self.job.title} - {self.status}"


class EmailResponse(BaseModel):
    """
    Responses received for sent job application emails
    """
    
    RESPONSE_TYPE_CHOICES = (
        ('reply', 'Direct Reply'),
        ('auto_reply', 'Auto Reply'),
        ('interview_invitation', 'Interview Invitation'),
        ('rejection', 'Rejection'),
        ('request_info', 'Request for Information'),
        ('other', 'Other'),
    )
    
    sent_email = models.ForeignKey(
        EmailSentRecord, 
        on_delete=models.CASCADE, 
        related_name='responses'
    )
    
    # Gmail details
    gmail_message_id = models.CharField(max_length=255, unique=True)
    thread_id = models.CharField(max_length=255, blank=True)
    
    # Response details
    from_email = models.EmailField()
    subject = models.CharField(max_length=500)
    body = models.TextField()
    received_at = models.DateTimeField()
    
    # Classification
    response_type = models.CharField(max_length=50, choices=RESPONSE_TYPE_CHOICES, default='other')
    is_automated = models.BooleanField(default=False)
    
    # Processing
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Extracted information
    extracted_data = models.JSONField(default=dict, help_text="AI-extracted information from response")
    
    # Priority and actions
    requires_action = models.BooleanField(default=False)
    action_taken = models.TextField(blank=True)
    
    class Meta:
        db_table = 'email_responses'
        ordering = ['-received_at']
    
    def __str__(self):
        return f"Response from {self.from_email} - {self.response_type}"


class AutoApplySession(BaseModel):
    """
    Track auto-apply sessions and their results
    """
    
    STATUS_CHOICES = (
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    google_integration = models.ForeignKey(
        GoogleIntegration, 
        on_delete=models.CASCADE, 
        related_name='auto_apply_sessions',
        null=True,
        blank=True
    )
    
    # Session details
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')
    
    # Configuration
    max_applications = models.IntegerField()
    search_filters = models.JSONField(default=dict)
    
    # Results
    jobs_found = models.IntegerField(default=0)
    applications_sent = models.IntegerField(default=0)
    applications_failed = models.IntegerField(default=0)
    
    # Timing
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    
    # Results summary
    results_summary = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'auto_apply_sessions'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Auto-apply session {self.session_id} - {self.status}"
    
    def mark_completed(self, summary: Dict = None):
        """Mark session as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if summary:
            self.results_summary = summary
        self.save()
    
    def mark_failed(self, error: str):
        """Mark session as failed"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.error_message = error
        self.save()


class GoogleAPIQuota(BaseModel):
    """
    Track Google API quota usage to avoid limits
    """
    
    google_integration = models.ForeignKey(
        GoogleIntegration, 
        on_delete=models.CASCADE, 
        related_name='quota_usage',
        null=True,
        blank=True
    )
    
    # Quota tracking
    date = models.DateField(default=timezone.now)
    emails_sent = models.IntegerField(default=0)
    api_calls = models.IntegerField(default=0)
    
    # Limits (per day)
    max_emails_per_day = models.IntegerField(default=250)  # Gmail API limit
    max_api_calls_per_day = models.IntegerField(default=1000)
    
    class Meta:
        db_table = 'google_api_quota'
        unique_together = ['google_integration', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"Quota for {self.google_integration.user.email} - {self.date}"
    
    @classmethod
    def get_or_create_today(cls, integration: GoogleIntegration):
        """Get or create today's quota record"""
        today = timezone.now().date()
        quota, created = cls.objects.get_or_create(
            google_integration=integration,
            date=today,
            defaults={
                'emails_sent': 0,
                'api_calls': 0,
            }
        )
        return quota
    
    def can_send_email(self) -> bool:
        """Check if user can send another email today"""
        return self.emails_sent < self.max_emails_per_day
    
    def can_make_api_call(self) -> bool:
        """Check if user can make another API call today"""
        return self.api_calls < self.max_api_calls_per_day
    
    def record_email_sent(self):
        """Record an email being sent"""
        self.emails_sent += 1
        self.save()
    
    def record_api_call(self):
        """Record an API call being made"""
        self.api_calls += 1
        self.save()
