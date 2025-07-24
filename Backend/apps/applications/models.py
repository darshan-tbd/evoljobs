"""
Application models for JobPilot (EvolJobs.com) Backend.
Contains job application functionality.
"""

from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import BaseModel
from apps.jobs.models import JobPosting

User = get_user_model()

class JobApplication(BaseModel):
    """
    Job application model
    """
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('reviewing', 'Under Review'),
        ('shortlisted', 'Shortlisted'),
        ('interviewed', 'Interviewed'),
        ('offered', 'Offered'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    )
    
    # Application basic info
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    
    # Application content
    cover_letter = models.TextField(blank=True)
    resume = models.FileField(upload_to='application_resumes/', blank=True, null=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    
    # Employer tracking
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    employer_notes = models.TextField(blank=True)
    
    # Additional fields
    expected_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    availability_date = models.DateField(null=True, blank=True)
    
    # External application tracking
    external_url = models.URLField(blank=True, null=True)  # For external job applications
    is_external_application = models.BooleanField(default=False)  # Flag to identify external applications
    
    def __str__(self):
        return f"{self.applicant.get_full_name()} applied for {self.job.title}"
    
    class Meta:
        db_table = 'job_applications'
        unique_together = ['job', 'applicant']
        ordering = ['-applied_at']

class ApplicationStatusHistory(BaseModel):
    """
    Application status change history
    """
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='status_history')
    previous_status = models.CharField(max_length=20, choices=JobApplication.STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=JobApplication.STATUS_CHOICES)
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'application_status_history'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.application} - {self.previous_status} → {self.new_status}"

class Interview(BaseModel):
    """
    Interview model for job applications
    """
    
    INTERVIEW_TYPES = (
        ('phone', 'Phone Interview'),
        ('video', 'Video Interview'),
        ('onsite', 'On-site Interview'),
        ('technical', 'Technical Interview'),
        ('panel', 'Panel Interview'),
    )
    
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    )
    
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='interviews')
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPES)
    
    # Interview details
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    location = models.CharField(max_length=255, blank=True)
    meeting_link = models.URLField(blank=True)
    
    # Participants
    interviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conducted_interviews')
    additional_interviewers = models.ManyToManyField(User, blank=True, related_name='additional_interviews')
    
    # Status and notes
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    interviewer_notes = models.TextField(blank=True)
    candidate_feedback = models.TextField(blank=True)
    
    # Scoring
    technical_score = models.IntegerField(null=True, blank=True, help_text="Score out of 10")
    communication_score = models.IntegerField(null=True, blank=True, help_text="Score out of 10")
    cultural_fit_score = models.IntegerField(null=True, blank=True, help_text="Score out of 10")
    overall_score = models.IntegerField(null=True, blank=True, help_text="Score out of 10")
    
    class Meta:
        db_table = 'interviews'
        ordering = ['-scheduled_at']
        
    def __str__(self):
        return f"{self.application} - {self.interview_type} on {self.scheduled_at}"

class ApplicationDocument(BaseModel):
    """
    Additional documents attached to applications
    """
    
    DOCUMENT_TYPES = (
        ('resume', 'Resume'),
        ('cover_letter', 'Cover Letter'),
        ('portfolio', 'Portfolio'),
        ('certificate', 'Certificate'),
        ('other', 'Other'),
    )
    
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='application_documents/')
    filename = models.CharField(max_length=255)
    file_size = models.IntegerField()
    
    class Meta:
        db_table = 'application_documents'
        
    def __str__(self):
        return f"{self.application} - {self.document_type}: {self.filename}"

 