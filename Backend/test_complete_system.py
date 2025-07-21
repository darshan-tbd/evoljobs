#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.notifications.models import Notification
from apps.jobs.models import JobPosting, JobAlert
from apps.companies.models import Company
from apps.core.models import Location
import time

def test_complete_system():
    print("🔧 TESTING COMPLETE NOTIFICATION SYSTEM")
    print("=" * 60)
    
    User = get_user_model()
    user = User.objects.get(email='admin1@gmail.com')
    
    print(f"✅ User: {user.email}")
    print(f"📊 Current notifications: {Notification.objects.filter(user=user).count()}")
    
    # Test 1: Create job alert
    print(f"\n📢 Creating job alert for user...")
    job_alert, created = JobAlert.objects.get_or_create(
        user=user,
        name="Python Developer Alert",
        defaults={
            'keywords': 'python, django, backend',
            'job_type': 'full_time',
            'experience_level': 'mid',
            'frequency': 'daily',
            'is_active': True
        }
    )
    
    if created:
        print(f"   ✅ Created new job alert: {job_alert.name}")
    else:
        print(f"   ℹ️  Using existing job alert: {job_alert.name}")
    
    # Test 2: Create a new job (this should trigger notifications)
    print(f"\n🏢 Creating test job posting...")
    
    try:
        # Get or create a company
        company, _ = Company.objects.get_or_create(
            name="TechCorp Inc.",
            defaults={
                'description': 'Leading tech company specializing in Python development',
                'website': 'https://techcorp.com',
                'founded_year': 2015,
                'headquarters': 'San Francisco, CA'
            }
        )
        
        # Create job posting
        timestamp = int(time.time())
        job = JobPosting.objects.create(
            title=f"Senior Python Developer #{timestamp}",
            slug=f"senior-python-developer-{timestamp}",
            description="We are looking for a skilled Python developer with Django experience to join our backend team. Must have experience with REST APIs, PostgreSQL, and Redis.",
            company=company,
            posted_by=user,
            job_type='full_time',
            experience_level='mid',
            remote_option='hybrid',
            salary_min=80000,
            salary_max=120000,
            requirements="Python, Django, PostgreSQL, REST APIs",
            qualifications="3+ years Python experience, Django framework knowledge",
            benefits="Health insurance, 401k, flexible hours, remote work",
            status='active',  # This should trigger notifications
            is_featured=True
        )
        
        print(f"   ✅ Created job: {job.title}")
        print(f"   📍 Job ID: {job.id}")
        print(f"   🎯 This should trigger job alert notifications!")
        
        # Manually trigger signal for testing (since it should happen automatically)
        from apps.jobs.signals import create_job_notifications
        create_job_notifications(JobPosting, job, True)
        
    except Exception as e:
        print(f"   ❌ Error creating job: {e}")
    
    # Check if notifications were created
    print(f"\n📊 Checking notifications after job creation...")
    new_notifications = Notification.objects.filter(user=user).order_by('-created_at')
    print(f"   Total notifications now: {new_notifications.count()}")
    
    # Show recent notifications
    print(f"\n📋 Recent notifications:")
    for i, n in enumerate(new_notifications[:5], 1):
        print(f"   {i}. {n.title}")
        print(f"      Type: {n.notification_type}")
        print(f"      Message: {n.message[:60]}...")
        print(f"      Created: {n.created_at}")
        print()
    
    print(f"🎯 TESTING INSTRUCTIONS:")
    print("=" * 60)
    print("1. 🔄 RESTART Django server: python manage.py runserver")
    print("2. 🌐 REFRESH browser: localhost:3000/notifications")
    print("3. ✅ CHECK WebSocket: Look for green 🟢 connection indicator")
    print("4. 📱 VERIFY notifications: Should see new job notifications")
    print("5. 🚀 CREATE more jobs to test real-time delivery")
    print()
    print("🔍 WHAT TO EXPECT:")
    print("- WebSocket should now connect (green indicator)")
    print("- New job alert notification should appear")
    print("- Real-time delivery should work")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    test_complete_system() 