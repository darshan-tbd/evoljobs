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
import time

def test_job_notifications():
    print("🚀 SIMPLE JOB NOTIFICATION TEST")
    print("=" * 50)
    
    User = get_user_model()
    user = User.objects.get(email='admin1@gmail.com')
    
    # Create job alert
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
    
    print(f"✅ Job alert ready: {job_alert.name}")
    
    # Try to use existing company or create simple one
    try:
        company = Company.objects.first()
        if not company:
            company = Company.objects.create(
                name="TechCorp Inc.",
                slug="techcorp-inc",
                description="Tech company"
            )
        print(f"✅ Using company: {company.name}")
        
        # Create simple job
        timestamp = int(time.time())
        job = JobPosting.objects.create(
            title=f"Python Developer #{timestamp}",
            slug=f"python-developer-{timestamp}",
            description="Python developer position with Django experience needed.",
            company=company,
            posted_by=user,
            job_type='full_time',
            experience_level='mid',
            status='active'
        )
        
        print(f"✅ Created job: {job.title}")
        
        # Check notifications after small delay
        import time
        time.sleep(1)
        
        latest_notifications = Notification.objects.filter(
            user=user,
            notification_type='job_alert'
        ).order_by('-created_at')[:3]
        
        print(f"\n📊 Recent job alert notifications:")
        for n in latest_notifications:
            print(f"   - {n.title}")
            print(f"     Created: {n.created_at}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Total count
    total = Notification.objects.filter(user=user).count()
    print(f"\n📱 Total notifications: {total}")
    
    print(f"\n🎯 NEXT STEPS:")
    print("1. 🔄 RESTART Django server for WebSocket fixes")
    print("2. 🌐 REFRESH notifications page")
    print("3. ✅ Check for green connection indicator")
    print("4. 📱 Look for new job notifications")

if __name__ == "__main__":
    test_job_notifications() 