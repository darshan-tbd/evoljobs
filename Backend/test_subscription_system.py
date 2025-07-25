#!/usr/bin/env python
"""
Test script for the subscription system
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

def test_subscription_system():
    """Test the subscription system functionality"""
    
    print("🧪 Testing Subscription System")
    print("=" * 50)
    
    # 1. Create test user
    print("\n1. Creating test user...")
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'user_type': 'job_seeker'
        }
    )
    if created:
        print(f"✅ Created test user: {user.email}")
    else:
        print(f"ℹ️  Test user already exists: {user.email}")
    
    # 2. Get or create subscription plans
    print("\n2. Setting up subscription plans...")
    free_plan = SubscriptionPlan.objects.get(plan_type='free')
    standard_plan = SubscriptionPlan.objects.get(plan_type='standard')
    print(f"✅ Free plan: {free_plan.name} - {free_plan.daily_application_limit} companies/day")
    print(f"✅ Standard plan: {standard_plan.name} - {standard_plan.daily_application_limit} companies/day")
    
    # 3. Test default plan (should be free)
    print("\n3. Testing default plan...")
    current_plan = SubscriptionService.get_user_plan(user)
    print(f"✅ Current plan: {current_plan.name}")
    print(f"✅ Daily limit: {current_plan.daily_application_limit}")
    
    # 4. Test daily usage tracking
    print("\n4. Testing daily usage tracking...")
    usage = SubscriptionService.get_today_usage(user)
    print(f"✅ Today's usage: {usage.applications_count} applications")
    print(f"✅ Companies applied today: {usage.companies_applied}")
    
    # 5. Test remaining applications
    print("\n5. Testing remaining applications...")
    remaining = SubscriptionService.get_remaining_applications(user)
    print(f"✅ Remaining applications: {remaining}")
    
    # 6. Create test companies and jobs
    print("\n6. Creating test companies and jobs...")
    companies = []
    for i in range(10):
        company, created = Company.objects.get_or_create(
            name=f'Test Company {i+1}',
            defaults={
                'slug': f'test-company-{i+1}',
                'description': f'Test company {i+1} description'
            }
        )
        companies.append(company)
    
    jobs = []
    for company in companies:
        job, created = JobPosting.objects.get_or_create(
            title=f'Test Job at {company.name}',
            company=company,
            defaults={
                'slug': f'test-job-{company.id}',
                'description': f'Test job description for {company.name}',
                'job_type': 'full_time',
                'experience_level': 'entry',
                'remote_option': 'onsite',
                'posted_by': user
            }
        )
        jobs.append(job)
    
    print(f"✅ Created {len(companies)} companies and {len(jobs)} jobs")
    
    # 7. Test application limits
    print("\n7. Testing application limits...")
    for i, job in enumerate(jobs[:6]):  # Try to apply to 6 jobs (should fail after 5)
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
            print(f"   ✅ Applied to {job.company.name}")
            
            # Record application
            SubscriptionService.record_application(user, job)
        else:
            print(f"   ❌ Cannot apply to {job.company.name} - limit reached")
            break
    
    # 8. Check updated usage
    print("\n8. Checking updated usage...")
    updated_usage = SubscriptionService.get_today_usage(user)
    print(f"✅ Updated usage: {updated_usage.applications_count} applications")
    print(f"✅ Companies applied: {updated_usage.companies_applied}")
    
    # 9. Test subscription upgrade
    print("\n9. Testing subscription upgrade...")
    subscription = SubscriptionService.create_subscription(user, standard_plan)
    print(f"✅ Upgraded to {subscription.plan.name}")
    
    # 10. Test new limits after upgrade
    print("\n10. Testing new limits after upgrade...")
    new_plan = SubscriptionService.get_user_plan(user)
    new_remaining = SubscriptionService.get_remaining_applications(user)
    print(f"✅ New plan: {new_plan.name}")
    print(f"✅ New daily limit: {new_plan.daily_application_limit}")
    print(f"✅ New remaining applications: {new_remaining}")
    
    # 11. Test subscription status
    print("\n11. Testing subscription status...")
    status = SubscriptionService.get_subscription_status(user)
    print(f"✅ Has active subscription: {status['has_active_subscription']}")
    print(f"✅ Plan name: {status['plan_name']}")
    print(f"✅ Daily limit: {status['daily_limit']}")
    print(f"✅ Used today: {status['used_today']}")
    print(f"✅ Remaining today: {status['remaining_today']}")
    
    # 12. Test application stats
    print("\n12. Testing application stats...")
    stats = SubscriptionService.get_application_stats(user)
    print(f"✅ Total applications: {stats['total_applications']}")
    print(f"✅ Monthly applications: {stats['monthly_applications']}")
    print(f"✅ Unique companies: {stats['unique_companies']}")
    
    print("\n🎉 Subscription system test completed successfully!")
    print("=" * 50)

if __name__ == '__main__':
    test_subscription_system() 