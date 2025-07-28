"""
Admin configuration for Job Applications.
"""

from django.contrib import admin
from .models import JobApplication, ApplicationStatusHistory, AutoAppliedJob

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['applicant', 'job', 'status', 'applied_at', 'is_external_application']
    list_filter = ['status', 'applied_at', 'is_external_application']
    search_fields = ['applicant__email', 'job__title', 'job__company__name']
    readonly_fields = ['applied_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('applicant', 'job', 'job__company')

@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['application', 'previous_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['previous_status', 'new_status', 'created_at']
    readonly_fields = ['created_at']

@admin.register(AutoAppliedJob)
class AutoAppliedJobAdmin(admin.ModelAdmin):
    """
    Admin interface for Auto Apply monitoring and logs
    """
    list_display = [
        'user', 'job_title', 'company_name', 'application_method', 
        'email_status', 'company_email', 'applied_at', 'was_successful'
    ]
    list_filter = [
        'application_method', 'email_status', 'applied_at', 
        'resume_attached', 'job__company__name'
    ]
    search_fields = [
        'user__email', 'user__first_name', 'user__last_name',
        'job__title', 'job__company__name', 'company_email'
    ]
    readonly_fields = [
        'applied_at', 'created_at', 'updated_at', 'gmail_message_id',
        'was_successful', 'needs_retry'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'job', 'applied_at')
        }),
        ('Application Details', {
            'fields': ('application_method', 'email_status', 'company_email', 'gmail_message_id')
        }),
        ('Content Tracking', {
            'fields': ('cover_letter_sent', 'resume_attached', 'job_application')
        }),
        ('Error Tracking', {
            'fields': ('error_message', 'retry_count')
        }),
        ('Status', {
            'fields': ('was_successful', 'needs_retry')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )
    
    def job_title(self, obj):
        return obj.job.title
    job_title.short_description = 'Job Title'
    job_title.admin_order_field = 'job__title'
    
    def company_name(self, obj):
        return obj.job.company.name if obj.job.company else 'N/A'
    company_name.short_description = 'Company'
    company_name.admin_order_field = 'job__company__name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'job', 'job__company', 'job_application'
        )
    
    # Add actions for bulk operations
    actions = ['mark_for_retry', 'mark_as_skipped']
    
    def mark_for_retry(self, request, queryset):
        """Mark failed applications for retry"""
        updated = queryset.filter(
            email_status__in=['failed', 'pending']
        ).update(
            email_status='pending',
            retry_count=0,
            error_message=''
        )
        self.message_user(request, f'{updated} auto-applications marked for retry.')
    mark_for_retry.short_description = 'Mark selected applications for retry'
    
    def mark_as_skipped(self, request, queryset):
        """Mark applications as skipped"""
        updated = queryset.update(email_status='skipped')
        self.message_user(request, f'{updated} auto-applications marked as skipped.')
    mark_as_skipped.short_description = 'Mark selected applications as skipped' 