from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    AIRecommendation, UserEmbedding, JobEmbedding, JobMatchScore,
    JobSummary, MLModelMetrics, UserInteractionLog, JobPerformanceMetrics
)
from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.core.models import Skill

User = get_user_model()

class AIRecommendationSerializer(serializers.ModelSerializer):
    """
    Serializer for AI recommendations
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    related_job_title = serializers.CharField(source='related_job.title', read_only=True)
    related_company_name = serializers.CharField(source='related_company.name', read_only=True)
    related_skills_list = serializers.StringRelatedField(source='related_skills', many=True, read_only=True)
    
    class Meta:
        model = AIRecommendation
        fields = [
            'id', 'user', 'user_email', 'recommendation_type', 'title', 'description',
            'content', 'related_job', 'related_job_title', 'related_company',
            'related_company_name', 'related_skills', 'related_skills_list',
            'relevance_score', 'confidence_score', 'priority_score',
            'is_viewed', 'is_clicked', 'is_dismissed', 'is_saved',
            'model_version', 'expires_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

class UserEmbeddingSerializer(serializers.ModelSerializer):
    """
    Serializer for user embeddings
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    embedding_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = UserEmbedding
        fields = [
            'id', 'user', 'user_email', 'embedding_vector', 'skills_vector',
            'preference_vector', 'last_updated', 'model_version', 'embedding_summary'
        ]
        read_only_fields = ['user', 'last_updated']
    
    def get_embedding_summary(self, obj):
        """Return summary statistics of embedding vectors"""
        import numpy as np
        try:
            embedding = np.array(obj.embedding_vector)
            skills = np.array(obj.skills_vector)
            preferences = np.array(obj.preference_vector)
            
            return {
                'embedding_dimension': len(embedding),
                'embedding_norm': float(np.linalg.norm(embedding)),
                'skills_norm': float(np.linalg.norm(skills)),
                'preferences_norm': float(np.linalg.norm(preferences)),
                'last_updated': obj.last_updated
            }
        except Exception:
            return {'error': 'Unable to compute embedding summary'}

class JobEmbeddingSerializer(serializers.ModelSerializer):
    """
    Serializer for job embeddings
    """
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    embedding_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = JobEmbedding
        fields = [
            'id', 'job', 'job_title', 'company_name', 'embedding_vector',
            'requirements_vector', 'description_vector', 'last_updated',
            'model_version', 'embedding_summary'
        ]
        read_only_fields = ['job', 'last_updated']
    
    def get_embedding_summary(self, obj):
        """Return summary statistics of embedding vectors"""
        import numpy as np
        try:
            embedding = np.array(obj.embedding_vector)
            requirements = np.array(obj.requirements_vector)
            description = np.array(obj.description_vector)
            
            return {
                'embedding_dimension': len(embedding),
                'embedding_norm': float(np.linalg.norm(embedding)),
                'requirements_norm': float(np.linalg.norm(requirements)),
                'description_norm': float(np.linalg.norm(description)),
                'last_updated': obj.last_updated
            }
        except Exception:
            return {'error': 'Unable to compute embedding summary'}

class JobMatchScoreSerializer(serializers.ModelSerializer):
    """
    Serializer for job match scores
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    job_location = serializers.CharField(source='job.location.name', read_only=True)
    job_type = serializers.CharField(source='job.get_job_type_display', read_only=True)
    match_quality = serializers.SerializerMethodField()
    
    class Meta:
        model = JobMatchScore
        fields = [
            'id', 'user', 'user_email', 'job', 'job_title', 'company_name',
            'job_location', 'job_type', 'overall_score', 'skills_match_score',
            'experience_match_score', 'location_match_score', 'salary_match_score',
            'confidence_score', 'model_version', 'rank_score', 'is_recommended',
            'was_viewed', 'was_clicked', 'was_applied', 'was_saved',
            'match_quality', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'job', 'created_at', 'updated_at']
    
    def get_match_quality(self, obj):
        """Return match quality categorization"""
        if obj.overall_score >= 0.8:
            return 'excellent'
        elif obj.overall_score >= 0.6:
            return 'good'
        elif obj.overall_score >= 0.4:
            return 'fair'
        else:
            return 'poor'

class JobSummarySerializer(serializers.ModelSerializer):
    """
    Serializer for AI-generated job summaries
    """
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    job_location = serializers.CharField(source='job.location.name', read_only=True)
    summary_quality = serializers.SerializerMethodField()
    
    class Meta:
        model = JobSummary
        fields = [
            'id', 'job', 'job_title', 'company_name', 'job_location',
            'brief_summary', 'detailed_summary', 'key_highlights',
            'extracted_skills', 'extracted_requirements', 'extracted_benefits',
            'job_category', 'seniority_level', 'confidence_score',
            'model_version', 'last_updated', 'summary_quality'
        ]
        read_only_fields = ['job', 'last_updated']
    
    def get_summary_quality(self, obj):
        """Return summary quality categorization"""
        if obj.confidence_score >= 0.8:
            return 'high'
        elif obj.confidence_score >= 0.6:
            return 'medium'
        else:
            return 'low'

class MLModelMetricsSerializer(serializers.ModelSerializer):
    """
    Serializer for ML model performance metrics
    """
    performance_grade = serializers.SerializerMethodField()
    metrics_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = MLModelMetrics
        fields = [
            'id', 'model_type', 'model_version', 'accuracy', 'precision',
            'recall', 'f1_score', 'predictions_count', 'avg_inference_time',
            'user_feedback_score', 'click_through_rate', 'evaluation_date',
            'training_data_size', 'additional_metrics', 'performance_grade',
            'metrics_summary'
        ]
        read_only_fields = ['evaluation_date']
    
    def get_performance_grade(self, obj):
        """Return performance grade based on metrics"""
        if obj.accuracy and obj.accuracy >= 0.9:
            return 'A'
        elif obj.accuracy and obj.accuracy >= 0.8:
            return 'B'
        elif obj.accuracy and obj.accuracy >= 0.7:
            return 'C'
        elif obj.accuracy and obj.accuracy >= 0.6:
            return 'D'
        else:
            return 'F'
    
    def get_metrics_summary(self, obj):
        """Return summary of key metrics"""
        return {
            'accuracy': obj.accuracy,
            'f1_score': obj.f1_score,
            'user_feedback': obj.user_feedback_score,
            'click_through_rate': obj.click_through_rate,
            'predictions_made': obj.predictions_count,
            'avg_response_time': obj.avg_inference_time
        }

class UserInteractionLogSerializer(serializers.ModelSerializer):
    """
    Serializer for user interaction logs
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    recommendation_title = serializers.CharField(source='recommendation.title', read_only=True)
    interaction_display = serializers.CharField(source='get_interaction_type_display', read_only=True)
    
    class Meta:
        model = UserInteractionLog
        fields = [
            'id', 'user', 'user_email', 'interaction_type', 'interaction_display',
            'job', 'job_title', 'company_name', 'recommendation', 'recommendation_title',
            'interaction_data', 'session_id', 'user_agent', 'ip_address', 'timestamp'
        ]
        read_only_fields = ['user', 'timestamp']

class JobPerformanceMetricsSerializer(serializers.ModelSerializer):
    """
    Serializer for job performance metrics
    """
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    job_location = serializers.CharField(source='job.location.name', read_only=True)
    performance_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPerformanceMetrics
        fields = [
            'id', 'job', 'job_title', 'company_name', 'job_location',
            'total_views', 'unique_views', 'avg_view_duration',
            'total_applications', 'qualified_applications', 'application_rate',
            'saves_count', 'shares_count', 'clicks_count',
            'avg_match_score', 'recommendation_clicks', 'ai_sourced_applications',
            'employer_rating', 'candidate_feedback_score', 'last_updated',
            'performance_summary'
        ]
        read_only_fields = ['job', 'last_updated']
    
    def get_performance_summary(self, obj):
        """Return performance summary"""
        return {
            'total_engagement': obj.total_views + obj.clicks_count + obj.saves_count,
            'conversion_rate': (obj.total_applications / obj.total_views) if obj.total_views > 0 else 0,
            'ai_effectiveness': (obj.ai_sourced_applications / obj.recommendation_clicks) if obj.recommendation_clicks > 0 else 0,
            'overall_rating': obj.employer_rating or 0,
            'match_quality': obj.avg_match_score or 0
        }

# Input serializers for API endpoints
class JobRecommendationRequestSerializer(serializers.Serializer):
    """
    Serializer for job recommendation requests
    """
    limit = serializers.IntegerField(default=10, min_value=1, max_value=100)
    refresh = serializers.BooleanField(default=False)
    job_types = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Filter by job types"
    )
    experience_levels = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Filter by experience levels"
    )
    remote_options = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Filter by remote options"
    )

class JobMatchRequestSerializer(serializers.Serializer):
    """
    Serializer for job match computation requests
    """
    limit = serializers.IntegerField(default=50, min_value=1, max_value=200)
    job_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Specific job IDs to match against"
    )
    min_score = serializers.FloatField(
        default=0.0,
        min_value=0.0,
        max_value=1.0,
        help_text="Minimum match score threshold"
    )

class InteractionFeedbackSerializer(serializers.Serializer):
    """
    Serializer for interaction feedback
    """
    job_id = serializers.IntegerField()
    interaction_type = serializers.ChoiceField(
        choices=['view', 'click', 'apply', 'save', 'share', 'dismiss']
    )
    interaction_data = serializers.JSONField(
        required=False,
        help_text="Additional interaction data"
    )
    session_id = serializers.CharField(required=False)
    user_agent = serializers.CharField(required=False)

class JobSummaryRequestSerializer(serializers.Serializer):
    """
    Serializer for job summary requests
    """
    job_id = serializers.IntegerField()
    regenerate = serializers.BooleanField(default=False)
    
class BatchJobProcessingSerializer(serializers.Serializer):
    """
    Serializer for batch job processing requests
    """
    job_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Specific job IDs to process"
    )
    process_type = serializers.ChoiceField(
        choices=['embeddings', 'summaries', 'all'],
        default='all'
    )
    batch_size = serializers.IntegerField(default=50, min_value=1, max_value=100) 