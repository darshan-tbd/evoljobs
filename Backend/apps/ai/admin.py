from django.contrib import admin
from .models import (
    AIRecommendation, UserEmbedding, JobEmbedding, JobMatchScore,
    JobSummary, MLModelMetrics, UserInteractionLog, JobPerformanceMetrics
)

@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'recommendation_type', 'title', 'relevance_score', 'is_viewed', 'created_at']
    list_filter = ['recommendation_type', 'is_viewed', 'is_clicked', 'is_dismissed']
    search_fields = ['user__email', 'recommendation_type', 'title']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'recommendation_type', 'title', 'description')
        }),
        ('Content', {
            'fields': ('content', 'related_job', 'related_company', 'related_skills')
        }),
        ('Scoring', {
            'fields': ('relevance_score', 'confidence_score', 'priority_score')
        }),
        ('Tracking', {
            'fields': ('is_viewed', 'is_clicked', 'is_dismissed', 'is_saved')
        }),
        ('Metadata', {
            'fields': ('model_version', 'expires_at', 'created_at', 'updated_at')
        })
    )

@admin.register(UserEmbedding)
class UserEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['user', 'model_version', 'last_updated']
    list_filter = ['model_version', 'last_updated']
    search_fields = ['user__email']
    readonly_fields = ['last_updated']

@admin.register(JobEmbedding)
class JobEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['job', 'model_version', 'last_updated']
    list_filter = ['model_version', 'last_updated']
    search_fields = ['job__title', 'job__company__name']
    readonly_fields = ['last_updated']

@admin.register(JobMatchScore)
class JobMatchScoreAdmin(admin.ModelAdmin):
    list_display = ['user', 'job', 'overall_score', 'is_recommended', 'was_viewed', 'was_applied', 'created_at']
    list_filter = ['is_recommended', 'was_viewed', 'was_clicked', 'was_applied', 'was_saved']
    search_fields = ['user__email', 'job__title', 'job__company__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'job')
        }),
        ('Scores', {
            'fields': ('overall_score', 'skills_match_score', 'experience_match_score', 
                      'location_match_score', 'salary_match_score', 'confidence_score')
        }),
        ('Ranking', {
            'fields': ('rank_score', 'is_recommended')
        }),
        ('Interactions', {
            'fields': ('was_viewed', 'was_clicked', 'was_applied', 'was_saved')
        }),
        ('Metadata', {
            'fields': ('model_version', 'created_at', 'updated_at')
        })
    )

@admin.register(JobSummary)
class JobSummaryAdmin(admin.ModelAdmin):
    list_display = ['job', 'job_category', 'seniority_level', 'confidence_score', 'last_updated']
    list_filter = ['job_category', 'seniority_level', 'model_version']
    search_fields = ['job__title', 'job__company__name', 'job_category']
    readonly_fields = ['last_updated']
    
    fieldsets = (
        (None, {
            'fields': ('job', 'job_category', 'seniority_level')
        }),
        ('Summaries', {
            'fields': ('brief_summary', 'detailed_summary', 'key_highlights')
        }),
        ('Extracted Info', {
            'fields': ('extracted_skills', 'extracted_requirements', 'extracted_benefits')
        }),
        ('Quality', {
            'fields': ('confidence_score', 'model_version', 'last_updated')
        })
    )

@admin.register(MLModelMetrics)
class MLModelMetricsAdmin(admin.ModelAdmin):
    list_display = ['model_type', 'model_version', 'accuracy', 'f1_score', 'predictions_count', 'evaluation_date']
    list_filter = ['model_type', 'model_version', 'evaluation_date']
    search_fields = ['model_type', 'model_version']
    readonly_fields = ['evaluation_date']
    
    fieldsets = (
        (None, {
            'fields': ('model_type', 'model_version')
        }),
        ('Performance Metrics', {
            'fields': ('accuracy', 'precision', 'recall', 'f1_score')
        }),
        ('Usage Metrics', {
            'fields': ('predictions_count', 'avg_inference_time')
        }),
        ('Quality Metrics', {
            'fields': ('user_feedback_score', 'click_through_rate')
        }),
        ('Metadata', {
            'fields': ('evaluation_date', 'training_data_size', 'additional_metrics')
        })
    )

@admin.register(UserInteractionLog)
class UserInteractionLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'interaction_type', 'job', 'timestamp']
    list_filter = ['interaction_type', 'timestamp']
    search_fields = ['user__email', 'job__title']
    readonly_fields = ['timestamp']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'interaction_type', 'job', 'recommendation')
        }),
        ('Data', {
            'fields': ('interaction_data', 'session_id')
        }),
        ('Context', {
            'fields': ('user_agent', 'ip_address', 'timestamp')
        })
    )

@admin.register(JobPerformanceMetrics)
class JobPerformanceMetricsAdmin(admin.ModelAdmin):
    list_display = ['job', 'total_views', 'total_applications', 'application_rate', 'avg_match_score', 'last_updated']
    list_filter = ['last_updated']
    search_fields = ['job__title', 'job__company__name']
    readonly_fields = ['last_updated']
    
    fieldsets = (
        (None, {
            'fields': ('job',)
        }),
        ('View Metrics', {
            'fields': ('total_views', 'unique_views', 'avg_view_duration')
        }),
        ('Application Metrics', {
            'fields': ('total_applications', 'qualified_applications', 'application_rate')
        }),
        ('Engagement Metrics', {
            'fields': ('saves_count', 'shares_count', 'clicks_count')
        }),
        ('AI Metrics', {
            'fields': ('avg_match_score', 'recommendation_clicks', 'ai_sourced_applications')
        }),
        ('Quality Metrics', {
            'fields': ('employer_rating', 'candidate_feedback_score', 'last_updated')
        })
    ) 