from django.contrib import admin
from .models import JobApplication, ApplicationStatusHistory, Interview, ApplicationDocument

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['applicant', 'job', 'status', 'applied_at']
    list_filter = ['status', 'applied_at']
    search_fields = ['applicant__email', 'job__title']

@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['application', 'previous_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['previous_status', 'new_status', 'created_at']

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ['application', 'interview_type', 'scheduled_at', 'status', 'interviewer']
    list_filter = ['interview_type', 'status', 'scheduled_at']
    search_fields = ['application__applicant__email', 'interviewer__email']

@admin.register(ApplicationDocument)
class ApplicationDocumentAdmin(admin.ModelAdmin):
    list_display = ['application', 'document_type', 'filename', 'file_size']
    list_filter = ['document_type']
    search_fields = ['application__applicant__email', 'filename'] 