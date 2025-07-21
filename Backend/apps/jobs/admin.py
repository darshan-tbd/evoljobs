from django.contrib import admin
from .models import JobPosting, JobView, SavedJob, JobAlert

@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'job_type', 'status', 'is_featured', 'created_at']
    list_filter = ['job_type', 'status', 'is_featured', 'experience_level', 'remote_option']
    search_fields = ['title', 'company__name', 'description']
    prepopulated_fields = {'slug': ('title',)}

@admin.register(JobView)
class JobViewAdmin(admin.ModelAdmin):
    list_display = ['job', 'user', 'ip_address', 'created_at']
    list_filter = ['created_at']
    search_fields = ['job__title', 'user__email']

@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ['user', 'job', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'job__title']

@admin.register(JobAlert)
class JobAlertAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'frequency', 'is_active', 'last_sent']
    list_filter = ['frequency', 'is_active']
    search_fields = ['user__email', 'name', 'keywords'] 