from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from apps.core.models import BaseModel

User = get_user_model()

class SubscriptionPlan(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField()
    features = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    
    # Daily application limits
    daily_application_limit = models.IntegerField(default=5, help_text="Maximum applications per day")
    
    # Plan type
    PLAN_TYPES = (
        ('free', 'Free'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('enterprise', 'Enterprise'),
    )
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='free')
    
    # Additional features
    priority_support = models.BooleanField(default=False)
    advanced_analytics = models.BooleanField(default=False)
    custom_branding = models.BooleanField(default=False)
    api_access = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'subscription_plans'
        ordering = ['price']

class UserSubscription(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    # Subscription status
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('pending', 'Pending'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Auto-renewal settings
    auto_renew = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"
    
    @property
    def is_expired(self):
        return timezone.now() > self.end_date
    
    @property
    def days_remaining(self):
        if self.is_expired:
            return 0
        return (self.end_date - timezone.now()).days
    
    class Meta:
        db_table = 'user_subscriptions'
        ordering = ['-created_at']

class DailyApplicationUsage(BaseModel):
    """
    Track daily application usage for subscription limits
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_usage')
    date = models.DateField()
    applications_count = models.IntegerField(default=0)
    companies_applied = models.JSONField(default=list, help_text="List of company IDs applied to today")
    
    class Meta:
        db_table = 'daily_application_usage'
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.email} - {self.date} ({self.applications_count} applications)"
    
    @classmethod
    def get_or_create_today(cls, user):
        """Get or create today's usage record for a user"""
        today = timezone.now().date()
        usage, created = cls.objects.get_or_create(
            user=user,
            date=today,
            defaults={'applications_count': 0, 'companies_applied': []}
        )
        return usage
    
    def add_application(self, company_id):
        """Add an application for a company"""
        if company_id not in self.companies_applied:
            self.companies_applied.append(company_id)
            self.applications_count = len(self.companies_applied)
            self.save()
    
    def can_apply_to_company(self, company_id, daily_limit):
        """Check if user can apply to a company based on daily limit"""
        # If already applied to this company today, return False
        if company_id in self.companies_applied:
            return False
        
        # Check if daily limit reached
        return self.applications_count < daily_limit
    
    def get_remaining_applications(self, daily_limit):
        """Get remaining applications for today"""
        return max(0, daily_limit - self.applications_count) 