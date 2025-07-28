"""
Google Integration admin for JobPilot (EvolJobs.com)
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    GoogleIntegration, EmailSentRecord, EmailResponse, 
    AutoApplySession, GoogleAPIQuota
)

@admin.register(GoogleIntegration)
class GoogleIntegrationAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'google_email', 'status', 'auto_apply_enabled', 
        'token_status', 'last_sync', 'error_count'
    ]
    list_filter = ['status', 'auto_apply_enabled', 'created_at']
    search_fields = ['user__email', 'google_email']
    readonly_fields = [
        'access_token_encrypted', 'refresh_token_encrypted', 
        'token_expires_at', 'google_user_id', 'last_sync',
        'error_count', 'last_error', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'google_email', 'google_user_id')
        }),
        ('Integration Status', {
            'fields': ('status', 'last_sync', 'scope')
        }),
        ('Token Information', {
            'fields': ('token_expires_at', 'access_token_encrypted', 'refresh_token_encrypted'),
            'classes': ('collapse',),
            'description': 'Sensitive token data (encrypted)'
        }),
        ('Auto-Apply Configuration', {
            'fields': ('auto_apply_enabled', 'auto_apply_filters')
        }),
        ('Error Tracking', {
            'fields': ('error_count', 'last_error'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def token_status(self, obj):
        if obj.is_token_valid:
            return format_html('<span style="color: green;">Valid</span>')
        else:
            return format_html('<span style="color: red;">Expired</span>')
    token_status.short_description = 'Token Status'
    
    def get_readonly_fields(self, request, obj=None):
        # Make tokens read-only to prevent accidental exposure
        readonly = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly.extend(['user'])
        return readonly

@admin.register(EmailSentRecord)
class EmailSentRecordAdmin(admin.ModelAdmin):
    list_display = [
        'google_integration', 'job', 'to_email', 'subject_truncated', 
        'status', 'sent_at', 'response_count'
    ]
    list_filter = ['status', 'sent_at', 'google_integration__user']
    search_fields = ['to_email', 'subject', 'job__title', 'job__company__name']
    readonly_fields = [
        'gmail_message_id', 'sent_at', 'delivered_at', 
        'response_count', 'last_response_at', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Email Details', {
            'fields': ('google_integration', 'job', 'application', 'to_email', 'subject')
        }),
        ('Gmail Information', {
            'fields': ('gmail_message_id', 'status', 'sent_at', 'delivered_at')
        }),
        ('Content', {
            'fields': ('email_body', 'attachments'),
            'classes': ('collapse',)
        }),
        ('Response Tracking', {
            'fields': ('response_count', 'last_response_at')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        })
    )
    
    def subject_truncated(self, obj):
        return obj.subject[:50] + '...' if len(obj.subject) > 50 else obj.subject
    subject_truncated.short_description = 'Subject'

@admin.register(EmailResponse)
class EmailResponseAdmin(admin.ModelAdmin):
    list_display = [
        'sent_email', 'from_email', 'subject_truncated', 
        'response_type', 'received_at', 'requires_action', 'is_processed'
    ]
    list_filter = [
        'response_type', 'is_automated', 'requires_action', 
        'is_processed', 'received_at'
    ]
    search_fields = ['from_email', 'subject', 'body']
    readonly_fields = [
        'gmail_message_id', 'thread_id', 'received_at', 
        'processed_at', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Response Details', {
            'fields': ('sent_email', 'from_email', 'subject', 'received_at')
        }),
        ('Gmail Information', {
            'fields': ('gmail_message_id', 'thread_id')
        }),
        ('Classification', {
            'fields': ('response_type', 'is_automated')
        }),
        ('Content', {
            'fields': ('body',),
            'classes': ('collapse',)
        }),
        ('Processing', {
            'fields': ('is_processed', 'processed_at', 'requires_action', 'action_taken')
        }),
        ('AI Analysis', {
            'fields': ('extracted_data',),
            'classes': ('collapse',)
        })
    )
    
    def subject_truncated(self, obj):
        return obj.subject[:50] + '...' if len(obj.subject) > 50 else obj.subject
    subject_truncated.short_description = 'Subject'

@admin.register(AutoApplySession)
class AutoApplySessionAdmin(admin.ModelAdmin):
    list_display = [
        'session_id', 'google_integration', 'status', 
        'applications_sent', 'applications_failed', 'started_at', 'duration'
    ]
    list_filter = ['status', 'started_at']
    search_fields = ['session_id', 'google_integration__user__email']
    readonly_fields = [
        'session_id', 'started_at', 'completed_at', 
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Session Information', {
            'fields': ('google_integration', 'session_id', 'status')
        }),
        ('Configuration', {
            'fields': ('max_applications', 'search_filters')
        }),
        ('Results', {
            'fields': (
                'jobs_found', 'applications_sent', 'applications_failed',
                'results_summary'
            )
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at')
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        })
    )
    
    def duration(self, obj):
        if obj.completed_at and obj.started_at:
            duration = obj.completed_at - obj.started_at
            return str(duration)
        elif obj.started_at:
            duration = timezone.now() - obj.started_at
            return f"{str(duration)} (running)"
        return "N/A"
    duration.short_description = 'Duration'

@admin.register(GoogleAPIQuota)
class GoogleAPIQuotaAdmin(admin.ModelAdmin):
    list_display = [
        'google_integration', 'date', 'emails_sent', 'email_quota_percentage',
        'api_calls', 'api_quota_percentage'
    ]
    list_filter = ['date']
    search_fields = ['google_integration__user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Quota Information', {
            'fields': ('google_integration', 'date')
        }),
        ('Usage', {
            'fields': ('emails_sent', 'api_calls')
        }),
        ('Limits', {
            'fields': ('max_emails_per_day', 'max_api_calls_per_day')
        })
    )
    
    def email_quota_percentage(self, obj):
        percentage = (obj.emails_sent / obj.max_emails_per_day) * 100
        color = 'green' if percentage < 80 else 'orange' if percentage < 95 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, percentage
        )
    email_quota_percentage.short_description = 'Email Quota %'
    
    def api_quota_percentage(self, obj):
        percentage = (obj.api_calls / obj.max_api_calls_per_day) * 100
        color = 'green' if percentage < 80 else 'orange' if percentage < 95 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, percentage
        )
    api_quota_percentage.short_description = 'API Quota %'
