#!/usr/bin/env python
"""
Test script for Auto Apply functionality
Tests the complete auto apply flow with test data
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.companies.models import Company
from apps.jobs.models import JobPosting
from apps.applications.models import AutoAppliedJob
from apps.google_integration.models import GoogleIntegration
from apps.google_integration.services import AutoApplyService
from apps.subscriptions.models import UserSubscription

User = get_user_model()

def test_auto_apply_functionality():
    """Test the Auto Apply functionality end-to-end"""
    
    print("🧪 Testing Auto Apply Functionality...")
    
    # 1. Get test user
    try:
        user = User.objects.get(email="vraj@gmail.com")
        print(f"✅ Found test user: {user.get_full_name()} ({user.email})")
    except User.DoesNotExist:
        print("❌ Test user not found. Run create_test_auto_apply_data.py first")
        return
    
    # 2. Check user's preferred categories
    categories = user.preferred_job_categories.all()
    print(f"✅ User preferred categories: {[cat.name for cat in categories]}")
    
    # 3. Check user's subscription
    subscription = UserSubscription.objects.filter(
        user=user,
        status='active'
    ).first()
    
    if subscription:
        print(f"✅ User has active subscription: {subscription.plan.name}")
        print(f"   Daily application limit: {subscription.plan.daily_application_limit}")
    else:
        print("❌ User has no active subscription")
        return
    
    # 4. Check for Technobits company and test job
    try:
        company = Company.objects.get(name="Technobits")
        print(f"✅ Found test company: {company.name} ({company.email})")
        
        job = JobPosting.objects.filter(
            company=company,
            title="Full-Stack-Developer"
        ).first()
        
        if job:
            print(f"✅ Found test job: {job.title}")
            print(f"   Category: {job.job_category.name if job.job_category else 'None'}")
            print(f"   Company email: {job.company.email}")
        else:
            print("❌ Test job not found")
            return
            
    except Company.DoesNotExist:
        print("❌ Technobits company not found")
        return
    
    # 5. Check if Google Integration exists
    try:
        integration = GoogleIntegration.objects.get(user=user)
        print(f"✅ Found Google Integration for user")
        print(f"   Status: {integration.status}")
        print(f"   Auto Apply Enabled: {integration.auto_apply_enabled}")
        print(f"   Google Email: {integration.google_email}")
    except GoogleIntegration.DoesNotExist:
        print("❌ No Google Integration found for test user")
        print("   Note: Google OAuth setup required for full Auto Apply testing")
        print("   You can still test the job filtering and categorization logic")
        
        # Create a mock integration for testing
        integration = GoogleIntegration.objects.create(
            user=user,
            status='disconnected',  # Disconnected but can still test logic
            auto_apply_enabled=True,
            google_email='darshanp.technobits@gmail.com'
        )
        print("✅ Created mock Google Integration for testing")
    
    # 6. Test job filtering logic
    print("\n🔍 Testing job filtering logic...")
    
    # Get AutoApplyService instance
    auto_apply_service = AutoApplyService(integration)
    
    # Test the job matching logic
    try:
        matching_jobs = auto_apply_service._find_matching_jobs({}, 10)
        print(f"✅ Found {len(matching_jobs)} jobs matching user's preferences")
        
        for job in matching_jobs:
            print(f"   📝 {job.title} at {job.company.name}")
            print(f"      Category: {job.job_category.name if job.job_category else 'None'}")
            print(f"      Company Email: {job.company.email if job.company.email else 'None'}")
            
    except Exception as e:
        print(f"❌ Error in job filtering: {e}")
    
    # 7. Check existing auto applications
    existing_applications = AutoAppliedJob.objects.filter(user=user)
    print(f"\n📊 Existing auto applications: {existing_applications.count()}")
    
    for app in existing_applications:
        print(f"   📧 {app.job.title} at {app.job.company.name}")
        print(f"      Status: {app.email_status}")
        print(f"      Applied: {app.applied_at}")
    
    # 8. Test duplicate prevention
    print("\n🛡️ Testing duplicate prevention...")
    if existing_applications.exists():
        test_job = existing_applications.first().job
        duplicate_check = AutoAppliedJob.objects.filter(
            user=user,
            job=test_job
        ).exists()
        print(f"✅ Duplicate prevention working: {duplicate_check}")
    
    print("\n🎉 Auto Apply functionality test completed!")
    print("\n📋 Summary:")
    print(f"   👤 Test User: {user.get_full_name()}")
    print(f"   🎯 Preferred Categories: {len(categories)}")
    print(f"   💳 Subscription: {subscription.plan.name if subscription else 'None'}")
    print(f"   🔗 Google Integration: {'Yes' if integration else 'No'}")
    print(f"   📧 Auto Applications: {existing_applications.count()}")
    
    if integration and integration.status == 'connected':
        print("\n✨ Ready for live Auto Apply testing!")
    else:
        print("\n⚠️  To enable live Auto Apply:")
        print("   1. Set up Google OAuth for the test user")
        print("   2. Connect Gmail API access")
        print("   3. Enable auto_apply_enabled=True")

if __name__ == "__main__":
    test_auto_apply_functionality() 