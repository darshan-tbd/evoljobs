from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta
from .models import SubscriptionPlan, UserSubscription, DailyApplicationUsage
from apps.applications.models import JobApplication
from apps.jobs.models import JobPosting

class SubscriptionService:
    """
    Service class to handle subscription-related operations
    """
    
    @staticmethod
    def get_user_active_subscription(user):
        """Get user's active subscription"""
        try:
            return UserSubscription.objects.filter(
                user=user,
                is_active=True,
                status='active',
                end_date__gt=timezone.now()
            ).latest('created_at')
        except UserSubscription.DoesNotExist:
            return None
    
    @staticmethod
    def get_user_plan(user):
        """Get user's current plan (active subscription or default free plan)"""
        subscription = SubscriptionService.get_user_active_subscription(user)
        if subscription:
            return subscription.plan
        
        # Return default free plan if no active subscription
        try:
            return SubscriptionPlan.objects.get(plan_type='free', is_active=True)
        except SubscriptionPlan.DoesNotExist:
            # Create default free plan if it doesn't exist
            return SubscriptionPlan.objects.create(
                name='Free Plan',
                description='Basic plan with limited applications',
                price=0.00,
                duration_days=30,
                plan_type='free',
                daily_application_limit=5,
                features=['Basic job search', 'Limited applications']
            )
    
    @staticmethod
    def get_daily_application_limit(user):
        """Get user's daily application limit based on their plan"""
        plan = SubscriptionService.get_user_plan(user)
        return plan.daily_application_limit
    
    @staticmethod
    def get_today_usage(user):
        """Get user's application usage for today"""
        return DailyApplicationUsage.get_or_create_today(user)
    
    @staticmethod
    def get_remaining_applications(user):
        """Get remaining applications for today"""
        usage = SubscriptionService.get_today_usage(user)
        daily_limit = SubscriptionService.get_daily_application_limit(user)
        return usage.get_remaining_applications(daily_limit)
    
    @staticmethod
    def can_apply_to_job(user, job):
        """Check if user can apply to a specific job based on subscription limits"""
        # Get user's plan and daily limit
        plan = SubscriptionService.get_user_plan(user)
        daily_limit = plan.daily_application_limit
        
        # Get today's usage
        usage = SubscriptionService.get_today_usage(user)
        
        # Check if user can apply to this company
        company_id = str(job.company.id)
        return usage.can_apply_to_company(company_id, daily_limit)
    
    @staticmethod
    @transaction.atomic
    def record_application(user, job):
        """Record a job application and update daily usage"""
        # Get today's usage
        usage = SubscriptionService.get_today_usage(user)
        
        # Add application for this company
        company_id = str(job.company.id)
        usage.add_application(company_id)
        
        return usage
    
    @staticmethod
    def get_subscription_status(user):
        """Get comprehensive subscription status for user"""
        subscription = SubscriptionService.get_user_active_subscription(user)
        plan = SubscriptionService.get_user_plan(user)
        usage = SubscriptionService.get_today_usage(user)
        daily_limit = plan.daily_application_limit
        remaining = usage.get_remaining_applications(daily_limit)
        
        return {
            'has_active_subscription': subscription is not None,
            'plan_name': plan.name,
            'plan_type': plan.plan_type,
            'daily_limit': daily_limit,
            'used_today': usage.applications_count,
            'remaining_today': remaining,
            'companies_applied_today': usage.companies_applied,
            'subscription_end_date': subscription.end_date if subscription else None,
            'days_remaining': subscription.days_remaining if subscription else 0,
            'is_expired': subscription.is_expired if subscription else True,
            'features': plan.features,
            'price': float(plan.price),
        }
    
    @staticmethod
    def get_available_plans():
        """Get all available subscription plans"""
        return SubscriptionPlan.objects.filter(is_active=True).order_by('price')
    
    @staticmethod
    def create_subscription(user, plan, start_date=None, end_date=None):
        """Create a new subscription for a user"""
        if start_date is None:
            start_date = timezone.now()
        
        if end_date is None:
            end_date = start_date + timedelta(days=plan.duration_days)
        
        # Deactivate any existing active subscriptions
        UserSubscription.objects.filter(
            user=user,
            is_active=True,
            status='active'
        ).update(is_active=False, status='cancelled')
        
        # Create new subscription
        subscription = UserSubscription.objects.create(
            user=user,
            plan=plan,
            start_date=start_date,
            end_date=end_date,
            is_active=True,
            status='active'
        )
        
        return subscription
    
    @staticmethod
    def check_and_update_expired_subscriptions():
        """Check and update expired subscriptions"""
        expired_subscriptions = UserSubscription.objects.filter(
            is_active=True,
            status='active',
            end_date__lte=timezone.now()
        )
        
        for subscription in expired_subscriptions:
            subscription.status = 'expired'
            subscription.is_active = False
            subscription.save()
        
        return expired_subscriptions.count()
    
    @staticmethod
    def get_usage_history(user, days=30):
        """Get user's application usage history"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        usage_records = DailyApplicationUsage.objects.filter(
            user=user,
            date__gte=start_date
        ).order_by('-date')
        
        return usage_records
    
    @staticmethod
    def get_application_stats(user):
        """Get comprehensive application statistics for user"""
        # Get total applications
        total_applications = JobApplication.objects.filter(applicant=user).count()
        
        # Get applications this month
        this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_applications = JobApplication.objects.filter(
            applicant=user,
            applied_at__gte=this_month_start
        ).count()
        
        # Get unique companies applied to
        unique_companies = JobApplication.objects.filter(
            applicant=user
        ).values('job__company').distinct().count()
        
        # Get current plan info
        plan = SubscriptionService.get_user_plan(user)
        subscription_status = SubscriptionService.get_subscription_status(user)
        
        return {
            'total_applications': total_applications,
            'monthly_applications': monthly_applications,
            'unique_companies': unique_companies,
            'current_plan': {
                'name': plan.name,
                'type': plan.plan_type,
                'daily_limit': plan.daily_application_limit,
            },
            'today_usage': {
                'used': subscription_status['used_today'],
                'remaining': subscription_status['remaining_today'],
                'limit': subscription_status['daily_limit'],
            }
        } 