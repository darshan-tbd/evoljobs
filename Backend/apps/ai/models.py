from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from apps.core.models import BaseModel, Skill, Industry, Location
from apps.jobs.models import JobPosting
from apps.companies.models import Company
import json

User = get_user_model()

class UserEmbedding(BaseModel):
    """
    Model to store user embeddings for ML-powered job matching
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='embedding')
    embedding_vector = ArrayField(
        models.FloatField(), 
        size=256, 
        help_text="256-dimensional user embedding vector"
    )
    skills_vector = ArrayField(
        models.FloatField(), 
        size=256, 
        help_text="Skills-based embedding vector"
    )
    preference_vector = ArrayField(
        models.FloatField(), 
        size=256, 
        help_text="Job preference embedding vector"
    )
    last_updated = models.DateTimeField(auto_now=True)
    model_version = models.CharField(max_length=50, default='v1.0')
    
    class Meta:
        db_table = 'user_embeddings'
        indexes = [
            models.Index(fields=['user', 'last_updated']),
            models.Index(fields=['model_version']),
        ]
    
    def __str__(self):
        return f"Embedding for {self.user.email}"

class JobEmbedding(BaseModel):
    """
    Model to store job embeddings for ML-powered job matching
    """
    job = models.OneToOneField(JobPosting, on_delete=models.CASCADE, related_name='embedding')
    embedding_vector = ArrayField(
        models.FloatField(), 
        size=256, 
        help_text="256-dimensional job embedding vector"
    )
    requirements_vector = ArrayField(
        models.FloatField(), 
        size=256, 
        help_text="Requirements-based embedding vector"
    )
    description_vector = ArrayField(
        models.FloatField(), 
        size=256, 
        help_text="Job description embedding vector"
    )
    last_updated = models.DateTimeField(auto_now=True)
    model_version = models.CharField(max_length=50, default='v1.0')
    
    class Meta:
        db_table = 'job_embeddings'
        indexes = [
            models.Index(fields=['job', 'last_updated']),
            models.Index(fields=['model_version']),
        ]
    
    def __str__(self):
        return f"Embedding for {self.job.title}"

class JobMatchScore(BaseModel):
    """
    Model to store computed job match scores between users and jobs
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_matches')
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='user_matches')
    
    # Scoring components
    overall_score = models.FloatField(help_text="Overall compatibility score (0-1)")
    skills_match_score = models.FloatField(help_text="Skills compatibility score (0-1)")
    experience_match_score = models.FloatField(help_text="Experience level match score (0-1)")
    location_match_score = models.FloatField(help_text="Location preference match score (0-1)")
    salary_match_score = models.FloatField(help_text="Salary expectation match score (0-1)")
    
    # ML model confidence
    confidence_score = models.FloatField(help_text="Model confidence in prediction (0-1)")
    model_version = models.CharField(max_length=50, default='v1.0')
    
    # Ranking and recommendation
    rank_score = models.IntegerField(null=True, blank=True, help_text="Rank among all jobs for this user")
    is_recommended = models.BooleanField(default=False)
    
    # Interaction tracking
    was_viewed = models.BooleanField(default=False)
    was_clicked = models.BooleanField(default=False)
    was_applied = models.BooleanField(default=False)
    was_saved = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'job_match_scores'
        unique_together = ['user', 'job']
        indexes = [
            models.Index(fields=['user', 'overall_score']),
            models.Index(fields=['job', 'overall_score']),
            models.Index(fields=['is_recommended', 'overall_score']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.job.title} ({self.overall_score:.2f})"

class JobSummary(BaseModel):
    """
    Model to store AI-generated job summaries
    """
    job = models.OneToOneField(JobPosting, on_delete=models.CASCADE, related_name='ai_summary')
    
    # Generated summaries
    brief_summary = models.TextField(help_text="Brief 2-3 sentence summary")
    detailed_summary = models.TextField(help_text="Detailed paragraph summary")
    key_highlights = models.JSONField(help_text="Key highlights as JSON array")
    
    # Extracted information
    extracted_skills = models.JSONField(help_text="AI-extracted skills from job description")
    extracted_requirements = models.JSONField(help_text="AI-extracted requirements")
    extracted_benefits = models.JSONField(help_text="AI-extracted benefits")
    
    # Classification
    job_category = models.CharField(max_length=100, help_text="AI-classified job category")
    seniority_level = models.CharField(max_length=50, help_text="AI-classified seniority level")
    
    # Quality metrics
    confidence_score = models.FloatField(help_text="AI confidence in summary quality (0-1)")
    model_version = models.CharField(max_length=50, default='v1.0')
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_summaries'
        indexes = [
            models.Index(fields=['job', 'last_updated']),
            models.Index(fields=['job_category']),
        ]
    
    def __str__(self):
        return f"Summary for {self.job.title}"

class AIRecommendation(BaseModel):
    """
    Enhanced AI recommendation model with detailed tracking
    """
    RECOMMENDATION_TYPES = (
        ('job_match', 'Job Match'),
        ('skill_development', 'Skill Development'),
        ('career_path', 'Career Path'),
        ('salary_insight', 'Salary Insight'),
        ('market_trend', 'Market Trend'),
        ('company_match', 'Company Match'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    recommendation_type = models.CharField(max_length=50, choices=RECOMMENDATION_TYPES)
    
    # Recommendation content
    title = models.CharField(max_length=255)
    description = models.TextField()
    content = models.JSONField(help_text="Structured recommendation data")
    
    # Related entities
    related_job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, null=True, blank=True)
    related_company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    related_skills = models.ManyToManyField(Skill, blank=True)
    
    # Scoring and ranking
    relevance_score = models.FloatField(help_text="Relevance score (0-1)")
    confidence_score = models.FloatField(help_text="AI confidence (0-1)")
    priority_score = models.FloatField(help_text="Priority for display (0-1)")
    
    # Interaction tracking
    is_viewed = models.BooleanField(default=False)
    is_clicked = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    is_saved = models.BooleanField(default=False)
    
    # Metadata
    model_version = models.CharField(max_length=50, default='v1.0')
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'ai_recommendations'
        indexes = [
            models.Index(fields=['user', 'recommendation_type', 'relevance_score']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"

class MLModelMetrics(BaseModel):
    """
    Model to track ML model performance and metrics
    """
    MODEL_TYPES = (
        ('user_embedding', 'User Embedding'),
        ('job_embedding', 'Job Embedding'),
        ('job_matching', 'Job Matching'),
        ('summary_generation', 'Summary Generation'),
        ('skill_extraction', 'Skill Extraction'),
        ('job_classification', 'Job Classification'),
    )
    
    model_type = models.CharField(max_length=50, choices=MODEL_TYPES)
    model_version = models.CharField(max_length=50)
    
    # Performance metrics
    accuracy = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
    recall = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    
    # Usage metrics
    predictions_count = models.IntegerField(default=0)
    avg_inference_time = models.FloatField(null=True, blank=True)
    
    # Quality metrics
    user_feedback_score = models.FloatField(null=True, blank=True)
    click_through_rate = models.FloatField(null=True, blank=True)
    
    # Metadata
    evaluation_date = models.DateTimeField(default=timezone.now)
    training_data_size = models.IntegerField(null=True, blank=True)
    additional_metrics = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'ml_model_metrics'
        unique_together = ['model_type', 'model_version', 'evaluation_date']
        indexes = [
            models.Index(fields=['model_type', 'model_version']),
            models.Index(fields=['evaluation_date']),
        ]
    
    def __str__(self):
        return f"{self.model_type} v{self.model_version} - {self.evaluation_date.date()}"

class UserInteractionLog(BaseModel):
    """
    Model to log user interactions for ML training and analytics
    """
    INTERACTION_TYPES = (
        ('job_view', 'Job View'),
        ('job_click', 'Job Click'),
        ('job_apply', 'Job Apply'),
        ('job_save', 'Job Save'),
        ('job_share', 'Job Share'),
        ('search_query', 'Search Query'),
        ('filter_apply', 'Filter Apply'),
        ('recommendation_click', 'Recommendation Click'),
        ('recommendation_dismiss', 'Recommendation Dismiss'),
        ('profile_update', 'Profile Update'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(max_length=50, choices=INTERACTION_TYPES)
    
    # Related entities
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, null=True, blank=True)
    recommendation = models.ForeignKey(AIRecommendation, on_delete=models.CASCADE, null=True, blank=True)
    
    # Interaction data
    interaction_data = models.JSONField(help_text="Structured interaction data")
    
    # Context
    session_id = models.CharField(max_length=255, blank=True)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Metadata
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_interaction_logs'
        indexes = [
            models.Index(fields=['user', 'interaction_type', 'timestamp']),
            models.Index(fields=['job', 'interaction_type']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.interaction_type} - {self.timestamp}"

class JobPerformanceMetrics(BaseModel):
    """
    Model to track job posting performance metrics
    """
    job = models.OneToOneField(JobPosting, on_delete=models.CASCADE, related_name='performance_metrics')
    
    # View metrics
    total_views = models.IntegerField(default=0)
    unique_views = models.IntegerField(default=0)
    avg_view_duration = models.FloatField(null=True, blank=True)
    
    # Application metrics
    total_applications = models.IntegerField(default=0)
    qualified_applications = models.IntegerField(default=0)
    application_rate = models.FloatField(null=True, blank=True)
    
    # Engagement metrics
    saves_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)
    clicks_count = models.IntegerField(default=0)
    
    # AI-powered metrics
    avg_match_score = models.FloatField(null=True, blank=True)
    recommendation_clicks = models.IntegerField(default=0)
    ai_sourced_applications = models.IntegerField(default=0)
    
    # Quality metrics
    employer_rating = models.FloatField(null=True, blank=True)
    candidate_feedback_score = models.FloatField(null=True, blank=True)
    
    # Metadata
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_performance_metrics'
        indexes = [
            models.Index(fields=['job', 'last_updated']),
            models.Index(fields=['avg_match_score']),
        ]
    
    def __str__(self):
        return f"Performance metrics for {self.job.title}" 