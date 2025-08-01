#!/usr/bin/env python
"""
Debug script for auto-apply 500 error
Checks all the requirements and potential issues
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.google_integration.models import GoogleIntegration
from apps.companies.models import Company
from apps.subscriptions.models import UserSubscription
from apps.jobs.models import JobPosting
import redis
from celery import current_app

User = get_user_model()

def check_redis_connection():
    """Check if Redis is running and accessible"""
    try:
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis: Connected and responsive")
        return True
    except Exception as e:
        print(f"❌ Redis: Connection failed - {e}")
        print("   💡 Solution: Start Redis with 'redis-server'")
        return False

def check_celery_connection():
    """Check if Celery can connect to Redis broker"""
    try:
        # Test Celery connection
        inspect = current_app.control.inspect()
        stats = inspect.stats()
        if stats:
            print("✅ Celery: Workers available and connected")
            print(f"   Active workers: {list(stats.keys())}")
            return True
        else:
            print("❌ Celery: No workers found")
            print("   💡 Solution: Start Celery worker with 'celery -A Backend worker --loglevel=info'")
            return False
    except Exception as e:
        print(f"❌ Celery: Connection failed - {e}")
        print("   💡 Solution: Start Celery worker with 'celery -A Backend worker --loglevel=info'")
        return False

def check_user_setup():
    """Check if Darshan user exists and has proper setup"""
    try:
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        print(f"✅ User: Found {user.get_full_name()} ({user.email})")
        
        # Check Google Integration
        try:
            integration = GoogleIntegration.objects.get(user=user)
            print(f"✅ Google Integration: Status = {integration.status}")
            print(f"✅ Auto Apply: {integration.auto_apply_enabled}")
            print(f"✅ Gmail: {integration.google_email}")
            
            if integration.status != 'connected':
                print(f"⚠️  Warning: Google integration status is '{integration.status}', should be 'connected'")
            if not integration.auto_apply_enabled:
                print(f"⚠️  Warning: Auto-apply is disabled")
                
            return user, integration
        except GoogleIntegration.DoesNotExist:
            print("❌ Google Integration: Not found")
            print("   💡 Solution: User needs to connect their Google account")
            return user, None
            
    except User.DoesNotExist:
        print("❌ User: darshanp.technobits@gmail.com not found")
        print("   💡 Solution: Run setup script to create user")
        return None, None

def check_company_setup():
    """Check if Technobits company exists"""
    try:
        companies = Company.objects.filter(email="technobits@gmail.com")
        if companies.exists():
            company = companies.first()
            print(f"✅ Company: Found {company.name} ({company.email})")
            return company
        else:
            print("❌ Company: No company found with email technobits@gmail.com")
            print("   💡 Solution: Create Technobits Digital company")
            return None
    except Exception as e:
        print(f"❌ Company check failed: {e}")
        return None

def check_subscription():
    """Check if user has active subscription"""
    try:
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        subscription = UserSubscription.objects.filter(
            user=user,
            status='active'
        ).first()
        
        if subscription:
            print(f"✅ Subscription: {subscription.plan.name} (Active)")
            print(f"   Daily limit: {subscription.plan.daily_application_limit}")
            return subscription
        else:
            print("❌ Subscription: No active subscription found")
            print("   💡 Solution: Create subscription for user")
            return None
    except Exception as e:
        print(f"❌ Subscription check failed: {e}")
        return None

def check_jobs_available():
    """Check if there are jobs available to apply to"""
    try:
        company = Company.objects.filter(email="technobits@gmail.com").first()
        if company:
            jobs = JobPosting.objects.filter(company=company)
            print(f"✅ Jobs: Found {jobs.count()} jobs at {company.name}")
            
            for job in jobs[:3]:
                print(f"   📋 {job.title} - Active: {job.is_active}")
            return jobs.count() > 0
        else:
            print("❌ Jobs: Cannot check - company not found")
            return False
    except Exception as e:
        print(f"❌ Jobs check failed: {e}")
        return False

def test_celery_task():
    """Test if we can trigger the Celery task"""
    try:
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        
        # Import the task
        from apps.google_integration.tasks import trigger_auto_apply_for_user
        
        print("🧪 Testing Celery task trigger...")
        result = trigger_auto_apply_for_user.delay(
            user.id,
            max_applications=1,
            filters=None
        )
        
        print(f"✅ Celery Task: Successfully queued with ID {result.id}")
        return True
        
    except Exception as e:
        print(f"❌ Celery Task: Failed to queue - {e}")
        return False

def main():
    print("🔍 DEBUGGING AUTO-APPLY 500 ERROR")
    print("=" * 50)
    
    # Check all requirements
    redis_ok = check_redis_connection()
    celery_ok = check_celery_connection()
    user, integration = check_user_setup()
    company = check_company_setup()
    subscription = check_subscription()
    jobs_ok = check_jobs_available()
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    issues = []
    if not redis_ok:
        issues.append("Redis not running")
    if not celery_ok:
        issues.append("Celery worker not running")
    if not user:
        issues.append("User not found")
    if not integration:
        issues.append("Google integration not set up")
    elif integration.status != 'connected':
        issues.append("Google integration not connected")
    elif not integration.auto_apply_enabled:
        issues.append("Auto-apply disabled")
    if not company:
        issues.append("Target company not found")
    if not subscription:
        issues.append("No active subscription")
    if not jobs_ok:
        issues.append("No jobs available")
    
    if issues:
        print("❌ ISSUES FOUND:")
        for issue in issues:
            print(f"   • {issue}")
        
        print("\n🔧 QUICK FIXES:")
        if "Redis not running" in issues:
            print("   1. Start Redis: redis-server")
        if "Celery worker not running" in issues:
            print("   2. Start Celery: celery -A Backend worker --loglevel=info")
        if "User not found" in issues:
            print("   3. Run: python setup_darshan_auto_apply.py")
        if "Google integration not connected" in issues:
            print("   4. User needs to connect Google account via OAuth")
        if "Target company not found" in issues:
            print("   5. Create Technobits Digital company")
        if "No active subscription" in issues:
            print("   6. Create subscription for user")
    else:
        print("✅ ALL CHECKS PASSED!")
        print("   The auto-apply system should work.")
        
        # If everything looks good, test the task
        if redis_ok and celery_ok:
            print("\n🧪 Testing actual Celery task...")
            task_ok = test_celery_task()
            if task_ok:
                print("✅ Celery task test successful!")
            else:
                print("❌ Celery task test failed - check worker logs")

if __name__ == "__main__":
    main() 