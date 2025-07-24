"""
User models for JobPilot (EvolJobs.com) Backend.
Contains custom user model and user profile functionality.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel, Location, Skill

class CustomUserManager(BaseUserManager):
    """
    Custom user manager for handling user creation
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and return a regular user with an email and password.
        """
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and return a superuser with an email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Custom user model using email as username
    """
    
    USER_TYPES = (
        ('job_seeker', 'Job Seeker'),
        ('employer', 'Employer'),
        ('admin', 'Admin'),
    )
    
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='job_seeker')
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_short_name(self):
        return self.first_name
    
    class Meta:
        db_table = 'users'

class UserProfile(BaseModel):
    """
    Extended user profile information
    """
    
    EXPERIENCE_LEVELS = (
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('executive', 'Executive'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    
    # Profile picture
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Location
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    location_text = models.CharField(max_length=255, blank=True)  # For simple text location
    
    # Job seeker specific fields
    current_job_title = models.CharField(max_length=255, blank=True)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS, blank=True)
    expected_salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expected_salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Resume - Reference to primary resume from Resume model
    resume = models.FileField(upload_to='resumes/', blank=True, null=True, help_text="Legacy field - use Resume model instead")
    resume_text = models.TextField(blank=True)  # Extracted text from resume
    
    @property
    def primary_resume(self):
        """Get the primary resume from the Resume model"""
        try:
            from apps.resumes.models import Resume
            return Resume.objects.filter(user=self.user, is_primary=True).first()
        except:
            return None
    
    @property
    def all_resumes(self):
        """Get all resumes from the Resume model"""
        try:
            from apps.resumes.models import Resume
            return Resume.objects.filter(user=self.user).order_by('-created_at')
        except:
            return []
    
    # Skills
    skills = models.ManyToManyField(Skill, blank=True)
    skills_text = models.TextField(blank=True)  # For simple text skills
    
    # Experience
    experience = models.TextField(blank=True)  # For work experience text
    
    # Preferences
    is_open_to_work = models.BooleanField(default=True)
    is_public_profile = models.BooleanField(default=True)
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Profile"
    

    
    class Meta:
        db_table = 'user_profiles'

class UserExperience(BaseModel):
    """
    User work experience entries
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    job_title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-start_date']
        db_table = 'user_experiences'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.job_title} at {self.company_name}"

class UserEducation(BaseModel):
    """
    User education entries
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    degree = models.CharField(max_length=255)
    field_of_study = models.CharField(max_length=255, blank=True)
    school_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-start_date']
        db_table = 'user_educations'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.degree} from {self.school_name}" 