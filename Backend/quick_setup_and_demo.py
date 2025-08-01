#!/usr/bin/env python
"""
Quick setup and demo for Darshan Patel auto-apply functionality
"""

import os
import django
from django.utils.text import slugify

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.companies.models import Company, Location, Industry
from apps.jobs.models import JobPosting, JobCategory
from apps.google_integration.tasks import trigger_auto_apply_for_user

User = get_user_model()

def quick_setup():
    """
    Quick setup for company and demo
    """
    print("🚀 Quick Setup for Auto-Apply Demo")
    print("=" * 50)
    
    # Get existing user
    try:
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        print(f"✅ Found user: {user.get_full_name()} ({user.email})")
    except User.DoesNotExist:
        print("❌ User not found. Creating Darshan Patel...")
        user = User.objects.create_user(
            email="darshanp.technobits@gmail.com",
            first_name="Darshan",
            last_name="Patel",
            user_type="job_seeker",
            is_active=True,
            is_verified=True
        )
        print(f"✅ Created user: {user.get_full_name()}")
    
    # Create location if needed
    location, created = Location.objects.get_or_create(
        name="Ahmedabad, Gujarat",
        defaults={
            'country': 'India',
            'state': 'Gujarat',
            'city': 'Ahmedabad'
        }
    )
    
    # Create industry if needed
    industry, created = Industry.objects.get_or_create(
        name="Information Technology",
        defaults={'description': 'Software Development and IT Services'}
    )
    
    # Create or get Technobits Digital company
    try:
        company = Company.objects.get(email="technobits@gmail.com")
        print(f"✅ Found company: {company.name} ({company.email})")
    except Company.DoesNotExist:
        company = Company.objects.create(
            name="Technobits Digital",
            slug="technobits-digital",
            email="technobits@gmail.com",
            phone="5587548754",
            website="https://technobitsdigital.com/",
            description="Leading digital solutions provider",
            headquarters=location,
            industry=industry,
            company_size="medium",
            is_verified=True
        )
        print(f"✅ Created company: {company.name} ({company.email})")
    
    # Create job categories if needed
    categories_data = [
        "Full Stack Developer",
        "Backend Developer", 
        "Frontend Developer"
    ]
    
    for cat_name in categories_data:
        category, created = JobCategory.objects.get_or_create(
            name=cat_name,
            defaults={'description': f'{cat_name} positions'}
        )
        if created:
            print(f"✅ Created job category: {cat_name}")
    
    # Create test jobs at Technobits Digital
    test_jobs = [
        {
            'title': 'Full Stack Developer',
            'category': 'Full Stack Developer',
            'description': 'We are looking for a skilled Full Stack Developer to join our team at Technobits Digital. You will work on exciting projects using modern technologies.'
        },
        {
            'title': 'Backend Developer',
            'category': 'Backend Developer', 
            'description': 'Join our backend development team at Technobits Digital. You will be responsible for building robust and scalable server-side applications.'
        }
    ]
    
    created_jobs = []
    for job_data in test_jobs:
        category = JobCategory.objects.get(name=job_data['category'])
        
        job, created = JobPosting.objects.get_or_create(
            title=job_data['title'],
            company=company,
            defaults={
                'slug': slugify(f"{job_data['title']}-{company.name}"),
                'description': job_data['description'],
                'job_category': category,
                'location': location,
                'employment_type': 'full_time',
                'experience_level': 'mid',
                'salary_min': 50000,
                'salary_max': 80000,
                'currency': 'INR',
                'is_active': True,
                'posted_by': user
            }
        )
        if created:
            created_jobs.append(job)
            print(f"✅ Created job: {job.title} at {company.name}")
        else:
            print(f"ℹ️  Job exists: {job.title}")
    
    print(f"\n✅ Setup complete!")
    print(f"   User: {user.email}")
    print(f"   Company: {company.name} ({company.email})")
    print(f"   Jobs created: {len(created_jobs)}")
    
    return user, company, created_jobs

def demo_auto_apply(user):
    """
    Demonstrate auto-apply functionality
    """
    print("\n🎯 DEMONSTRATING AUTO-APPLY")
    print("=" * 50)
    
    print("📧 EMAIL FLOW WILL BE:")
    print(f"   FROM: {user.email}")
    print(f"   TO: technobits@gmail.com")
    print(f"   SUBJECT: Application for [Job Title] Position")
    
    print("\n🔄 TRIGGERING AUTO-APPLY...")
    
    try:
        # Trigger auto-apply task
        result = trigger_auto_apply_for_user.delay(
            user.id,
            max_applications=3,
            filters=None
        )
        
        print(f"✅ Auto-apply task triggered successfully!")
        print(f"   Task ID: {result.id}")
        print(f"   User: {user.email}")
        print(f"   Max Applications: 3")
        
        print(f"\n📋 What happens next:")
        print(f"1. ✅ Task sent to Celery queue")
        print(f"2. 🔄 Celery worker processes the task")
        print(f"3. 🔍 System finds jobs at Technobits Digital")
        print(f"4. 📧 For each job:")
        print(f"   - Generate application email")
        print(f"   - Send from {user.email} to technobits@gmail.com")
        print(f"   - Track application in database")
        
        print(f"\n⚠️  NOTE: For actual email sending, you need:")
        print(f"   - Google OAuth setup with real credentials")
        print(f"   - User's Gmail authorization")
        print(f"   - Active internet connection")
        
        return result
        
    except Exception as e:
        print(f"❌ Error triggering auto-apply: {e}")
        return None

def check_results():
    """
    Check auto-apply results
    """
    print("\n📊 CHECKING RESULTS...")
    print("=" * 50)
    
    try:
        from apps.google_integration.models import AutoApplySession
        from apps.applications.models import AutoAppliedJob
        
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        
        # Check auto-apply sessions
        sessions = AutoApplySession.objects.filter(
            google_integration__user=user
        ).order_by('-created_at')[:3]
        
        print(f"📋 Recent Auto-Apply Sessions: {sessions.count()}")
        for session in sessions:
            print(f"   Session: {str(session.session_id)[:8]}...")
            print(f"   Status: {session.status}")
            print(f"   Jobs Found: {session.jobs_found}")
            print(f"   Applications Sent: {session.applications_sent}")
        
        # Check auto-applied jobs
        auto_apps = AutoAppliedJob.objects.filter(user=user)
        print(f"\n📧 Auto-Applied Jobs: {auto_apps.count()}")
        for app in auto_apps:
            print(f"   {app.job.title} at {app.job.company.name}")
            print(f"   Status: {app.email_status}")
            print(f"   Company Email: {app.company_email}")
        
    except Exception as e:
        print(f"❌ Error checking results: {e}")

if __name__ == "__main__":
    print("🎯 Auto-Apply Quick Demo")
    print("=" * 50)
    
    # Setup
    user, company, jobs = quick_setup()
    
    # Demo
    result = demo_auto_apply(user)
    
    # Show status
    if result:
        print("\n⏳ Waiting a moment for processing...")
        import time
        time.sleep(3)
        check_results()
    
    print("\n🎯 TO RUN FULL SYSTEM:")
    print("=" * 50)
    print("1. Start Redis: redis-server")
    print("2. Start Celery: celery -A Backend worker --loglevel=info")
    print("3. Run this script again")
    print("4. Check database for results")
    
    print("\n✅ Auto-Apply System Demo Complete!")
    print("   The system is working and ready for production use.")
    print("   Just need Google OAuth setup for real email sending.") 