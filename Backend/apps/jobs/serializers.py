from rest_framework import serializers
from .models import JobPosting, JobView, SavedJob, JobAlert, JobCategory
from apps.companies.models import Company
from apps.core.models import Location, Skill, Industry

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'logo', 'website', 'description']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'city', 'state', 'country', 'latitude', 'longitude']

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category']

class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Industry
        fields = ['id', 'name', 'description']

class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ['id', 'name', 'slug', 'description', 'is_active']

class JobPostingSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    industry = IndustrySerializer(read_only=True)
    job_category = JobCategorySerializer(read_only=True)
    required_skills = SkillSerializer(many=True, read_only=True)
    preferred_skills = SkillSerializer(many=True, read_only=True)
    
    # Additional computed fields
    is_recent = serializers.SerializerMethodField()
    is_trending = serializers.SerializerMethodField()
    is_urgent = serializers.SerializerMethodField()
    salary_display = serializers.SerializerMethodField()
    time_since_posted = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPosting
        fields = [
            'id', 'title', 'slug', 'description', 'company', 'location', 'industry', 'job_category',
            'job_type', 'experience_level', 'remote_option', 'salary_min', 'salary_max',
            'salary_currency', 'salary_type', 'salary_display', 'requirements',
            'qualifications', 'benefits', 'required_skills', 'preferred_skills',
            'application_deadline', 'application_email', 'application_url',
            'status', 'is_featured', 'views_count', 'applications_count',
            'meta_description', 'meta_keywords', 'external_source', 'external_url',
            'created_at', 'updated_at', 'is_recent', 'is_trending', 'is_urgent',
            'time_since_posted'
        ]
        read_only_fields = ['posted_by', 'views_count', 'applications_count', 'slug']
    
    def get_is_recent(self, obj):
        """Check if job was posted in the last 24 hours"""
        from django.utils import timezone
        from datetime import timedelta
        return obj.created_at >= timezone.now() - timedelta(hours=24)
    
    def get_is_trending(self, obj):
        """Check if job is trending (high views/applications)"""
        return obj.views_count > 100 or obj.applications_count > 10
    
    def get_is_urgent(self, obj):
        """Check if job has urgent deadline (within 7 days)"""
        from django.utils import timezone
        from datetime import timedelta
        if obj.application_deadline:
            return obj.application_deadline <= timezone.now() + timedelta(days=7)
        return False
    
    def get_salary_display(self, obj):
        """Format salary for display"""
        if not obj.salary_min:
            return "Not specified"
        
        def format_currency(amount):
            if amount >= 1000000:
                return f"${amount/1000000:.1f}M"
            elif amount >= 1000:
                return f"${amount/1000:.0f}K"
            else:
                return f"${amount:,.0f}"
        
        currency_symbol = "$" if obj.salary_currency == "USD" else obj.salary_currency
        type_suffix = ""
        if obj.salary_type == "hourly":
            type_suffix = "/hr"
        elif obj.salary_type == "monthly":
            type_suffix = "/month"
        elif obj.salary_type == "yearly":
            type_suffix = "/year"
        
        if obj.salary_max and obj.salary_max != obj.salary_min:
            return f"{format_currency(obj.salary_min)} - {format_currency(obj.salary_max)}{type_suffix}"
        else:
            return f"{format_currency(obj.salary_min)}{type_suffix}"
    
    def get_time_since_posted(self, obj):
        """Get human-readable time since job was posted"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(hours=1):
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"
        elif diff < timedelta(days=30):
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
        else:
            months = diff.days // 30
            return f"{months} month{'s' if months != 1 else ''} ago"

class JobPostingListSerializer(serializers.ModelSerializer):
    """Simplified serializer for job listings"""
    company = CompanySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    required_skills = SkillSerializer(many=True, read_only=True)
    salary_display = serializers.SerializerMethodField()
    time_since_posted = serializers.SerializerMethodField()
    is_recent = serializers.SerializerMethodField()
    is_urgent = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPosting
        fields = [
            'id', 'title', 'slug', 'company', 'location', 'job_type',
            'experience_level', 'remote_option', 'salary_display',
            'required_skills', 'is_featured', 'views_count',
            'applications_count', 'created_at', 'time_since_posted',
            'is_recent', 'is_urgent', 'application_deadline', 'external_url', 'application_url'
        ]
    
    def get_salary_display(self, obj):
        return JobPostingSerializer().get_salary_display(obj)
    
    def get_time_since_posted(self, obj):
        return JobPostingSerializer().get_time_since_posted(obj)
    
    def get_is_recent(self, obj):
        return JobPostingSerializer().get_is_recent(obj)
    
    def get_is_urgent(self, obj):
        return JobPostingSerializer().get_is_urgent(obj)

class JobViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobView
        fields = '__all__'
        read_only_fields = ['user']

class SavedJobSerializer(serializers.ModelSerializer):
    job = JobPostingListSerializer(read_only=True)
    
    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'created_at']
        read_only_fields = ['user']

class JobAlertSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    
    class Meta:
        model = JobAlert
        fields = '__all__'
        read_only_fields = ['user', 'last_sent'] 

class AdminJobPostingSerializer(serializers.ModelSerializer):
    """Admin serializer for job postings with full access"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    industry_name = serializers.CharField(source='industry.name', read_only=True)
    posted_by_name = serializers.CharField(source='posted_by.get_full_name', read_only=True)
    required_skills = serializers.StringRelatedField(many=True, read_only=True)
    preferred_skills = serializers.StringRelatedField(many=True, read_only=True)
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPosting
        fields = '__all__'
    
    def get_applications_count(self, obj):
        return obj.applications.count()

class AdminJobViewSerializer(serializers.ModelSerializer):
    """Admin serializer for job views with full access"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = JobView
        fields = '__all__'

class AdminSavedJobSerializer(serializers.ModelSerializer):
    """Admin serializer for saved jobs with full access"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = SavedJob
        fields = '__all__'

class AdminJobAlertSerializer(serializers.ModelSerializer):
    """Admin serializer for job alerts with full access"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = JobAlert
        fields = '__all__' 