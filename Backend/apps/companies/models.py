"""
Company models for JobPilot (EvolJobs.com) Backend.
Contains company and employer functionality.
"""

from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import BaseModel, Location, Industry

User = get_user_model()

class Company(BaseModel):
    """
    Company model for employers
    """
    
    COMPANY_SIZES = (
        ('startup', '1-10 employees'),
        ('small', '11-50 employees'),
        ('medium', '51-200 employees'),
        ('large', '201-1000 employees'),
        ('enterprise', '1000+ employees'),
    )
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    
    # Contact information
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Location
    headquarters = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Company details
    industry = models.ForeignKey(Industry, on_delete=models.SET_NULL, null=True, blank=True)
    company_size = models.CharField(max_length=20, choices=COMPANY_SIZES, blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    
    # Social media
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    
    # Company status
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    
    # SEO fields
    meta_description = models.TextField(blank=True)
    meta_keywords = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'Companies'
        ordering = ['name']

class CompanyEmployee(BaseModel):
    """
    Company employee relationship model
    """
    
    ROLES = (
        ('admin', 'Admin'),
        ('hr', 'HR Manager'),
        ('recruiter', 'Recruiter'),
        ('hiring_manager', 'Hiring Manager'),
        ('employee', 'Employee'),
    )
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='company_roles')
    role = models.CharField(max_length=20, choices=ROLES)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.role} at {self.company.name}"
    
    class Meta:
        db_table = 'company_employees'
        unique_together = ['company', 'user']

class CompanyReview(BaseModel):
    """
    Company review model
    """
    
    RATING_CHOICES = (
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    )
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='company_reviews')
    
    title = models.CharField(max_length=255)
    review_text = models.TextField()
    rating = models.IntegerField(choices=RATING_CHOICES)
    
    # Detailed ratings
    work_life_balance = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    salary_benefits = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    job_security = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    management = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    culture = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    
    # Review metadata
    is_current_employee = models.BooleanField(default=False)
    is_anonymous = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.company.name} - {self.rating} stars by {self.user.get_full_name()}"
    
    class Meta:
        db_table = 'company_reviews'
        unique_together = ['company', 'user']
        ordering = ['-created_at'] 