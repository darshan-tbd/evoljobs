"""
Job models for JobPilot (EvolJobs.com) Backend.
Contains job postings and related functionality.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.core.models import BaseModel, Location, Skill, Industry
from apps.companies.models import Company

User = get_user_model()

class JobCategory(BaseModel):
    """
    Job category model for categorizing jobs
    """
    name = models.CharField(max_length=100, unique=True, help_text="Category name (e.g., 'Full Stack Developer', 'Plumber', 'Cook')")
    slug = models.SlugField(unique=True, help_text="URL-friendly version of the category name")
    description = models.TextField(blank=True, help_text="Optional description of the category")
    keywords = models.TextField(blank=True, help_text="Comma-separated keywords for automatic categorization")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'job_categories'
        verbose_name = 'Job Category'
        verbose_name_plural = 'Job Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name

class JobPosting(BaseModel):
    """
    Job posting model
    """
    
    JOB_TYPES = (
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('temporary', 'Temporary'),
        ('volunteer', 'Volunteer'),
    )
    
    EXPERIENCE_LEVELS = (
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('executive', 'Executive'),
    )
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('closed', 'Closed'),
        ('filled', 'Filled'),
    )
    
    REMOTE_OPTIONS = (
        ('onsite', 'On-site'),
        ('remote', 'Remote'),
        ('hybrid', 'Hybrid'),
    )
    
    # Basic job information
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='job_postings')
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    
    # Job categorization
    job_category = models.ForeignKey(JobCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_postings', help_text="Automatically assigned job category")
    
    # Job details
    job_type = models.CharField(max_length=20, choices=JOB_TYPES)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS)
    remote_option = models.CharField(max_length=20, choices=REMOTE_OPTIONS, default='onsite')
    
    # Location
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Salary information
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=3, default='USD')
    salary_type = models.CharField(max_length=20, choices=(
        ('hourly', 'Hourly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ), default='yearly')
    
    # Requirements
    requirements = models.TextField(blank=True)
    qualifications = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    
    # Skills
    required_skills = models.ManyToManyField(Skill, blank=True, related_name='required_for_jobs')
    preferred_skills = models.ManyToManyField(Skill, blank=True, related_name='preferred_for_jobs')
    
    # Industry
    industry = models.ForeignKey(Industry, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Application settings
    application_deadline = models.DateTimeField(null=True, blank=True)
    application_email = models.EmailField(blank=True)
    application_url = models.URLField(blank=True)
    
    # Job status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    
    # Tracking
    views_count = models.IntegerField(default=0)
    applications_count = models.IntegerField(default=0)
    
    # SEO
    meta_description = models.TextField(blank=True)
    meta_keywords = models.TextField(blank=True)
    
    # External source (for scraped jobs)
    external_source = models.CharField(max_length=100, blank=True)
    external_id = models.CharField(max_length=255, blank=True)
    external_url = models.URLField(blank=True)
    
    def __str__(self):
        return f"{self.title} at {self.company.name}"
    
    def is_active(self):
        return self.status == 'active' and not self.is_deleted
    
    def is_expired(self):
        return self.application_deadline and self.application_deadline < timezone.now()
    
    class Meta:
        db_table = 'job_postings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['company', 'status']),
            models.Index(fields=['location', 'status']),
            models.Index(fields=['job_category', 'status']),
        ]

class JobView(BaseModel):
    """
    Job view tracking model
    """
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='job_views')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'job_views'
        unique_together = ['job', 'user', 'ip_address']

class SavedJob(BaseModel):
    """
    Saved job model for users to bookmark jobs
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='saved_by')
    
    class Meta:
        db_table = 'saved_jobs'
        unique_together = ['user', 'job']
        
    def __str__(self):
        return f"{self.user.get_full_name()} saved {self.job.title}"

class JobAlert(BaseModel):
    """
    Job alert model for users to get notified about new jobs
    """
    
    FREQUENCY_CHOICES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_alerts')
    name = models.CharField(max_length=255)
    
    # Search criteria
    keywords = models.CharField(max_length=255, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    job_type = models.CharField(max_length=20, choices=JobPosting.JOB_TYPES, blank=True)
    experience_level = models.CharField(max_length=20, choices=JobPosting.EXPERIENCE_LEVELS, blank=True)
    remote_option = models.CharField(max_length=20, choices=JobPosting.REMOTE_OPTIONS, blank=True)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Alert settings
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    is_active = models.BooleanField(default=True)
    last_sent = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'job_alerts'
        
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.name}" 