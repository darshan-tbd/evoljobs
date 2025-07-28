"""
Serializers for Google Integration API in JobPilot (EvolJobs.com)
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    GoogleIntegration, EmailSentRecord, EmailResponse, 
    AutoApplySession, GoogleAPIQuota
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """
    Basic user serializer for integration display
    """
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class AdminGoogleIntegrationSerializer(serializers.ModelSerializer):
    """
    Admin serializer for Google Integration model with full user details
    """
    user = UserBasicSerializer(read_only=True)
    token_status = serializers.SerializerMethodField()
    
    class Meta:
        model = GoogleIntegration
        fields = [
            'id', 'user', 'google_email', 'status', 'token_status',
            'last_sync', 'auto_apply_enabled', 'auto_apply_filters',
            'error_count', 'last_error', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'google_email', 'status', 'token_status',
            'last_sync', 'error_count', 'last_error', 'created_at', 'updated_at'
        ]
    
    def get_token_status(self, obj):
        """Get token validity status"""
        return 'valid' if obj.is_token_valid else 'expired'


class GoogleIntegrationSerializer(serializers.ModelSerializer):
    """
    Serializer for Google Integration model
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    token_status = serializers.SerializerMethodField()
    
    class Meta:
        model = GoogleIntegration
        fields = [
            'id', 'user_email', 'google_email', 'status', 'token_status',
            'last_sync', 'auto_apply_enabled', 'auto_apply_filters',
            'error_count', 'last_error', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_email', 'google_email', 'status', 'token_status',
            'last_sync', 'error_count', 'last_error', 'created_at', 'updated_at'
        ]
    
    def get_token_status(self, obj):
        """Get token validity status"""
        return 'valid' if obj.is_token_valid else 'expired'


class AdminEmailSentRecordSerializer(serializers.ModelSerializer):
    """
    Admin serializer for EmailSentRecord model with full details
    """
    google_integration = serializers.SerializerMethodField()
    job = serializers.SerializerMethodField()
    
    class Meta:
        model = EmailSentRecord
        fields = [
            'id', 'google_integration', 'job', 'to_email', 'subject', 'status', 
            'sent_at', 'delivered_at', 'response_count', 'last_response_at', 
            'attachments', 'metadata'
        ]
        read_only_fields = [
            'id', 'google_integration', 'job', 'sent_at', 'delivered_at', 
            'response_count', 'last_response_at'
        ]
    
    def get_google_integration(self, obj):
        return {
            'user': {
                'email': obj.google_integration.user.email,
                'first_name': obj.google_integration.user.first_name,
                'last_name': obj.google_integration.user.last_name
            }
        }
    
    def get_job(self, obj):
        return {
            'title': obj.job.title,
            'company': {
                'name': obj.job.company.name
            }
        }


class EmailSentRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for EmailSentRecord model
    """
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_company = serializers.CharField(source='job.company.name', read_only=True)
    application_id = serializers.UUIDField(source='application.id', read_only=True)
    
    class Meta:
        model = EmailSentRecord
        fields = [
            'id', 'job', 'job_title', 'job_company', 'application_id',
            'to_email', 'subject', 'status', 'sent_at', 'delivered_at',
            'response_count', 'last_response_at', 'attachments', 'metadata'
        ]
        read_only_fields = [
            'id', 'job_title', 'job_company', 'application_id',
            'sent_at', 'delivered_at', 'response_count', 'last_response_at'
        ]


class AdminEmailResponseSerializer(serializers.ModelSerializer):
    """
    Admin serializer for EmailResponse model with full details
    """
    sent_email = serializers.SerializerMethodField()
    
    class Meta:
        model = EmailResponse
        fields = [
            'id', 'sent_email', 'from_email', 'subject', 'body', 'received_at', 
            'response_type', 'is_automated', 'is_processed', 'processed_at', 
            'requires_action', 'action_taken', 'extracted_data'
        ]
        read_only_fields = [
            'id', 'sent_email', 'received_at', 'is_automated', 'extracted_data'
        ]
    
    def get_sent_email(self, obj):
        return {
            'job': {
                'title': obj.sent_email.job.title,
                'company': {
                    'name': obj.sent_email.job.company.name
                }
            }
        }


class EmailResponseSerializer(serializers.ModelSerializer):
    """
    Serializer for EmailResponse model
    """
    sent_email_subject = serializers.CharField(source='sent_email.subject', read_only=True)
    job_title = serializers.CharField(source='sent_email.job.title', read_only=True)
    job_company = serializers.CharField(source='sent_email.job.company.name', read_only=True)
    
    class Meta:
        model = EmailResponse
        fields = [
            'id', 'sent_email', 'sent_email_subject', 'job_title', 'job_company',
            'from_email', 'subject', 'body', 'received_at', 'response_type',
            'is_automated', 'is_processed', 'processed_at', 'requires_action',
            'action_taken', 'extracted_data'
        ]
        read_only_fields = [
            'id', 'sent_email_subject', 'job_title', 'job_company',
            'received_at', 'is_automated', 'extracted_data'
        ]


class AdminAutoApplySessionSerializer(serializers.ModelSerializer):
    """
    Admin serializer for AutoApplySession model with full details
    """
    google_integration = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = AutoApplySession
        fields = [
            'id', 'session_id', 'google_integration', 'status', 'max_applications',
            'search_filters', 'jobs_found', 'applications_sent', 'applications_failed',
            'started_at', 'completed_at', 'duration', 'success_rate',
            'error_message', 'results_summary'
        ]
        read_only_fields = [
            'id', 'session_id', 'google_integration', 'duration', 'success_rate'
        ]
    
    def get_google_integration(self, obj):
        return {
            'user': {
                'email': obj.google_integration.user.email,
                'first_name': obj.google_integration.user.first_name,
                'last_name': obj.google_integration.user.last_name
            }
        }
    
    def get_duration(self, obj):
        """Calculate session duration"""
        if obj.completed_at and obj.started_at:
            duration = obj.completed_at - obj.started_at
            return str(duration)
        elif obj.started_at:
            from django.utils import timezone
            duration = timezone.now() - obj.started_at
            return f"{str(duration)} (running)"
        return None
    
    def get_success_rate(self, obj):
        """Calculate success rate"""
        total_attempts = obj.applications_sent + obj.applications_failed
        if total_attempts > 0:
            return round((obj.applications_sent / total_attempts) * 100, 2)
        return 0.0


class AutoApplySessionSerializer(serializers.ModelSerializer):
    """
    Serializer for AutoApplySession model
    """
    user_email = serializers.EmailField(source='google_integration.user.email', read_only=True)
    duration = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = AutoApplySession
        fields = [
            'id', 'session_id', 'user_email', 'status', 'max_applications',
            'search_filters', 'jobs_found', 'applications_sent', 'applications_failed',
            'started_at', 'completed_at', 'duration', 'success_rate',
            'error_message', 'results_summary'
        ]
        read_only_fields = [
            'id', 'session_id', 'user_email', 'duration', 'success_rate'
        ]
    
    def get_duration(self, obj):
        """Calculate session duration"""
        if obj.completed_at and obj.started_at:
            duration = obj.completed_at - obj.started_at
            return str(duration)
        elif obj.started_at:
            from django.utils import timezone
            duration = timezone.now() - obj.started_at
            return f"{str(duration)} (running)"
        return None
    
    def get_success_rate(self, obj):
        """Calculate success rate"""
        total_attempts = obj.applications_sent + obj.applications_failed
        if total_attempts > 0:
            return round((obj.applications_sent / total_attempts) * 100, 2)
        return 0.0


class GoogleAPIQuotaSerializer(serializers.ModelSerializer):
    """
    Serializer for GoogleAPIQuota model
    """
    user_email = serializers.EmailField(source='google_integration.user.email', read_only=True)
    email_quota_percentage = serializers.SerializerMethodField()
    api_quota_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = GoogleAPIQuota
        fields = [
            'id', 'user_email', 'date', 'emails_sent', 'api_calls',
            'max_emails_per_day', 'max_api_calls_per_day',
            'email_quota_percentage', 'api_quota_percentage'
        ]
        read_only_fields = [
            'id', 'user_email', 'email_quota_percentage', 'api_quota_percentage'
        ]
    
    def get_email_quota_percentage(self, obj):
        """Calculate email quota percentage"""
        if obj.max_emails_per_day > 0:
            return round((obj.emails_sent / obj.max_emails_per_day) * 100, 2)
        return 0.0
    
    def get_api_quota_percentage(self, obj):
        """Calculate API quota percentage"""
        if obj.max_api_calls_per_day > 0:
            return round((obj.api_calls / obj.max_api_calls_per_day) * 100, 2)
        return 0.0


class AutoApplyConfigSerializer(serializers.Serializer):
    """
    Serializer for auto-apply configuration
    """
    auto_apply_enabled = serializers.BooleanField()
    auto_apply_filters = serializers.JSONField(required=False, default=dict)
    
    def validate_auto_apply_filters(self, value):
        """Validate auto-apply filters"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Filters must be a valid JSON object")
        
        # Validate filter structure
        allowed_filters = [
            'keywords', 'location', 'job_type', 'experience_level',
            'salary_min', 'salary_max', 'company_size', 'industry'
        ]
        
        for key in value.keys():
            if key not in allowed_filters:
                raise serializers.ValidationError(f"Invalid filter: {key}")
        
        return value


class EmailApplicationSerializer(serializers.Serializer):
    """
    Serializer for manual email application
    """
    job_id = serializers.UUIDField()
    cover_letter = serializers.CharField(max_length=5000)
    use_primary_resume = serializers.BooleanField(default=True)
    
    def validate_job_id(self, value):
        """Validate job exists and user hasn't applied"""
        from apps.jobs.models import JobPosting
        from apps.applications.models import JobApplication
        
        try:
            job = JobPosting.objects.get(id=value, is_active=True)
        except JobPosting.DoesNotExist:
            raise serializers.ValidationError("Job not found or not active")
        
        # Check if user already applied
        user = self.context['request'].user
        if JobApplication.objects.filter(job=job, applicant=user).exists():
            raise serializers.ValidationError("You have already applied to this job")
        
        return value


class OAuthCallbackSerializer(serializers.Serializer):
    """
    Serializer for OAuth callback
    """
    code = serializers.CharField()
    state = serializers.CharField()
    
    def validate_state(self, value):
        """Validate state parameter contains valid user ID"""
        try:
            user_id = int(value)
            User.objects.get(id=user_id)
            return value
        except (ValueError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid state parameter")


class TriggerAutoApplySerializer(serializers.Serializer):
    """
    Serializer for triggering auto-apply
    """
    max_applications = serializers.IntegerField(min_value=1, max_value=50, required=False)
    filters = serializers.JSONField(required=False, default=dict)
    
    def validate_filters(self, value):
        """Validate filters"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Filters must be a valid JSON object")
        return value


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics
    """
    integration_status = serializers.CharField()
    auto_apply_enabled = serializers.BooleanField()
    google_email = serializers.EmailField()
    last_sync = serializers.DateTimeField()
    emails_sent_today = serializers.IntegerField()
    emails_sent_this_week = serializers.IntegerField()
    emails_sent_this_month = serializers.IntegerField()
    responses_received = serializers.IntegerField()
    unprocessed_responses = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    quota_usage = serializers.JSONField()


class ResponseActionSerializer(serializers.Serializer):
    """
    Serializer for marking response as processed
    """
    action_taken = serializers.CharField(max_length=500, required=False, allow_blank=True)


class TokenRefreshSerializer(serializers.Serializer):
    """
    Serializer for token refresh request
    """
    force_refresh = serializers.BooleanField(default=False) 