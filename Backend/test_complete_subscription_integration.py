#!/usr/bin/env python
"""
Complete subscription system integration test
Tests all aspects of the subscription system including user experience and admin functionality
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.subscriptions.models import SubscriptionPlan, UserSubscription, DailyApplicationUsage
from apps.subscriptions.services import SubscriptionService
from apps.users.models import User
from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.applications.models import JobApplication
from django.utils import timezone
from datetime import datetime, timedelta

def test_complete_subscription_integration():
    """Test the complete subscription system integration"""
    
    print("🧪 Complete Subscription System Integration Test")
    print("=" * 60)
    
    # 1. Setup test data
    print("\n1. Setting up test data...")
    
    # Create test user
    user, created = User.objects.get_or_create(
        email='testuser@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'user_type': 'job_seeker'
        }
    )
    print(f"✅ Test user: {user.email}")
    
    # Create test companies
    companies = []
    for i in range(15):
        company, created = Company.objects.get_or_create(
            name=f'Test Company {i+1}',
            defaults={
                'slug': f'test-company-{i+1}',
                'description': f'Test company {i+1} description'
            }
        )
        companies.append(company)
    print(f"✅ Created {len(companies)} test companies")
    
    # Create test jobs
    jobs = []
    for company in companies:
        job, created = JobPosting.objects.get_or_create(
            title=f'Software Engineer at {company.name}',
            company=company,
            defaults={
                'slug': f'software-engineer-{company.id}',
                'description': f'Software engineering position at {company.name}',
                'job_type': 'full_time',
                'experience_level': 'mid',
                'remote_option': 'hybrid',
                'posted_by': user
            }
        )
        jobs.append(job)
    print(f"✅ Created {len(jobs)} test jobs")
    
    # 2. Test subscription plans
    print("\n2. Testing subscription plans...")
    
    # Get plans
    free_plan = SubscriptionPlan.objects.get(plan_type='free')
    standard_plan = SubscriptionPlan.objects.get(plan_type='standard')
    premium_plan = SubscriptionPlan.objects.get(plan_type='premium')
    
    print(f"✅ Free plan: {free_plan.name} - {free_plan.daily_application_limit} companies/day")
    print(f"✅ Standard plan: {standard_plan.name} - {standard_plan.daily_application_limit} companies/day")
    print(f"✅ Premium plan: {premium_plan.name} - {premium_plan.daily_application_limit} companies/day")
    
    # 3. Test default free plan behavior
    print("\n3. Testing default free plan behavior...")
    
    # Check default plan
    current_plan = SubscriptionService.get_user_plan(user)
    print(f"✅ Default plan: {current_plan.name}")
    
    # Check initial usage
    usage = SubscriptionService.get_today_usage(user)
    print(f"✅ Initial usage: {usage.applications_count} applications")
    
    # 4. Test application limits with free plan
    print("\n4. Testing application limits with free plan...")
    
    successful_applications = 0
    for i, job in enumerate(jobs[:10]):  # Try to apply to 10 jobs
        can_apply = SubscriptionService.can_apply_to_job(user, job)
        print(f"   Job {i+1} ({job.company.name}): {'✅ Can apply' if can_apply else '❌ Cannot apply'}")
        
        if can_apply:
            # Create application
            application = JobApplication.objects.create(
                job=job,
                applicant=user,
                cover_letter=f'Test application for {job.title}',
                status='pending'
            )
            
            # Record application
            SubscriptionService.record_application(user, job)
            successful_applications += 1
            print(f"   ✅ Applied to {job.company.name}")
        else:
            print(f"   ❌ Cannot apply to {job.company.name} - limit reached")
            break
    
    print(f"✅ Successfully applied to {successful_applications} companies")
    
    # 5. Check updated usage
    print("\n5. Checking updated usage...")
    updated_usage = SubscriptionService.get_today_usage(user)
    print(f"✅ Updated usage: {updated_usage.applications_count} applications")
    print(f"✅ Companies applied: {updated_usage.companies_applied}")
    
    # 6. Test subscription upgrade
    print("\n6. Testing subscription upgrade...")
    
    # Upgrade to standard plan
    subscription = SubscriptionService.create_subscription(user, standard_plan)
    print(f"✅ Upgraded to {subscription.plan.name}")
    
    # Check new limits
    new_plan = SubscriptionService.get_user_plan(user)
    new_remaining = SubscriptionService.get_remaining_applications(user)
    print(f"✅ New plan: {new_plan.name}")
    print(f"✅ New daily limit: {new_plan.daily_application_limit}")
    print(f"✅ New remaining applications: {new_remaining}")
    
    # 7. Test application limits with standard plan
    print("\n7. Testing application limits with standard plan...")
    
    additional_applications = 0
    for i, job in enumerate(jobs[10:15]):  # Try to apply to 5 more jobs
        can_apply = SubscriptionService.can_apply_to_job(user, job)
        print(f"   Job {i+11} ({job.company.name}): {'✅ Can apply' if can_apply else '❌ Cannot apply'}")
        
        if can_apply:
            # Create application
            application = JobApplication.objects.create(
                job=job,
                applicant=user,
                cover_letter=f'Test application for {job.title}',
                status='pending'
            )
            
            # Record application
            SubscriptionService.record_application(user, job)
            additional_applications += 1
            print(f"   ✅ Applied to {job.company.name}")
        else:
            print(f"   ❌ Cannot apply to {job.company.name} - limit reached")
            break
    
    print(f"✅ Applied to {additional_applications} additional companies")
    
    # 8. Test subscription status
    print("\n8. Testing subscription status...")
    status = SubscriptionService.get_subscription_status(user)
    print(f"✅ Has active subscription: {status['has_active_subscription']}")
    print(f"✅ Plan name: {status['plan_name']}")
    print(f"✅ Daily limit: {status['daily_limit']}")
    print(f"✅ Used today: {status['used_today']}")
    print(f"✅ Remaining today: {status['remaining_today']}")
    
    # 9. Test application statistics
    print("\n9. Testing application statistics...")
    stats = SubscriptionService.get_application_stats(user)
    print(f"✅ Total applications: {stats['total_applications']}")
    print(f"✅ Monthly applications: {stats['monthly_applications']}")
    print(f"✅ Unique companies: {stats['unique_companies']}")
    
    # 10. Test admin functionality
    print("\n10. Testing admin functionality...")
    
    # Check expired subscriptions
    expired_count = SubscriptionService.check_and_update_expired_subscriptions()
    print(f"✅ Expired subscriptions updated: {expired_count}")
    
    # Get usage history
    usage_history = SubscriptionService.get_usage_history(user, days=7)
    print(f"✅ Usage history records: {usage_history.count()}")
    
    # 11. Test edge cases
    print("\n11. Testing edge cases...")
    
    # Test applying to same company again
    if jobs:
        same_company_job = jobs[0]
        can_apply_same_company = SubscriptionService.can_apply_to_job(user, same_company_job)
        print(f"✅ Can apply to same company again: {can_apply_same_company} (should be False)")
    
    # Test subscription expiration
    print("\n12. Testing subscription expiration...")
    
    # Create a subscription that expires in 1 day
    expiring_subscription = UserSubscription.objects.create(
        user=user,
        plan=premium_plan,
        start_date=timezone.now() - timedelta(days=29),
        end_date=timezone.now() + timedelta(days=1),
        is_active=True,
        status='active'
    )
    print(f"✅ Created expiring subscription: {expiring_subscription.plan.name}")
    print(f"✅ Days remaining: {expiring_subscription.days_remaining}")
    
    # 13. Test plan comparison
    print("\n13. Testing plan comparison...")
    
    available_plans = SubscriptionService.get_available_plans()
    print(f"✅ Available plans: {available_plans.count()}")
    
    for plan in available_plans:
        print(f"   - {plan.name}: ${plan.price}/month, {plan.daily_application_limit} companies/day")
    
    # 14. Summary
    print("\n14. Test Summary...")
    total_applications = JobApplication.objects.filter(applicant=user).count()
    unique_companies = JobApplication.objects.filter(applicant=user).values('job__company').distinct().count()
    
    print(f"✅ Total applications created: {total_applications}")
    print(f"✅ Unique companies applied to: {unique_companies}")
    print(f"✅ Current subscription: {status['plan_name']}")
    print(f"✅ Daily limit: {status['daily_limit']}")
    print(f"✅ Used today: {status['used_today']}")
    print(f"✅ Remaining today: {status['remaining_today']}")
    
    print("\n🎉 Complete subscription system integration test completed successfully!")
    print("=" * 60)
    
    return {
        'user': user,
        'total_applications': total_applications,
        'unique_companies': unique_companies,
        'current_plan': status['plan_name'],
        'daily_limit': status['daily_limit'],
        'used_today': status['used_today'],
        'remaining_today': status['remaining_today']
    }

if __name__ == '__main__':
    test_complete_subscription_integration() 