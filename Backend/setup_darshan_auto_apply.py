#!/usr/bin/env python
"""
Setup script for Darshan Patel auto-apply functionality
Creates the specific user and company data as requested and sets up auto-apply
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
from apps.google_integration.models import GoogleIntegration
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from apps.google_integration.tasks import trigger_auto_apply_for_user

User = get_user_model()

def setup_darshan_auto_apply():
    """
    Setup Darshan Patel user and Technobits Digital company with auto-apply functionality
    """
    print("🚀 Setting up Darshan Patel Auto-Apply System")
    print("=" * 50)
    
    # 1. Create/Get Location
    print("📍 Setting up location...")
    location, created = Location.objects.get_or_create(
        name="Ahmedabad, Gujarat, India",
        defaults={
            'country': 'India',
            'state': 'Gujarat',
            'city': 'Ahmedabad'
        }
    )
    if created:
        print(f"   ✅ Created location: {location.name}")
    else:
        print(f"   ℹ️  Location already exists: {location.name}")
    
    # 2. Create/Get Industry
    print("🏭 Setting up industry...")
    industry, created = Industry.objects.get_or_create(
        name="Information Technology",
        defaults={'description': 'Software Development and IT Services'}
    )
    if created:
        print(f"   ✅ Created industry: {industry.name}")
    else:
        print(f"   ℹ️  Industry already exists: {industry.name}")
    
    # 3. Create Technobits Digital Company
    print("🏢 Setting up Technobits Digital company...")
    company, created = Company.objects.get_or_create(
        name="Technobits Digital",
        defaults={
            'slug': slugify("Technobits Digital"),
            'description': 'Technobits Digital is a leading digital solutions provider specializing in web development, mobile apps, and custom software solutions.',
            'website': 'https://technobitsdigital.com/',
            'email': 'technobits@gmail.com',
            'phone': '5587548754',
            'headquarters': location,
            'industry': industry,
            'company_size': 'medium',
            'founded_year': 2020,
            'is_verified': True,
            'is_featured': True
        }
    )
    if created:
        print(f"   ✅ Created company: {company.name}")
        print(f"       Email: {company.email}")
        print(f"       Phone: {company.phone}")
        print(f"       Website: {company.website}")
    else:
        print(f"   ℹ️  Company already exists: {company.name} ({company.email})")
    
    # 4. Create Darshan Patel User
    print("👤 Setting up Darshan Patel user...")
    user, created = User.objects.get_or_create(
        email="darshanp.technobits@gmail.com",
        defaults={
            'first_name': 'Darshan',
            'last_name': 'Patel',
            'user_type': 'job_seeker',
            'is_active': True,
            'is_verified': True
        }
    )
    
    if created:
        # Note: No password needed since user logs in with Google OAuth
        print(f"   ✅ Created user: {user.get_full_name()} ({user.email})")
        print(f"       Login method: Google OAuth (no password needed)")
    else:
        print(f"   ℹ️  User already exists: {user.get_full_name()} ({user.email})")
    
    # 5. Create Job Categories for matching
    print("📂 Setting up job categories...")
    categories = [
        'Full Stack Developer',
        'Backend Developer',
        'Frontend Developer',
        'Software Engineer',
        'Web Developer'
    ]
    
    user_categories = []
    for category_name in categories:
        category, created = JobCategory.objects.get_or_create(
            name=category_name,
            defaults={'description': f'{category_name} positions'}
        )
        user_categories.append(category)
        if created:
            print(f"   ✅ Created category: {category_name}")
        else:
            print(f"   ℹ️  Category exists: {category_name}")
    
    # Set user's preferred job categories
    user.preferred_job_categories.set(user_categories)
    print(f"   ✅ Set user preferred categories: {[cat.name for cat in user_categories]}")
    
    # 6. Create subscription plan and assign to user
    print("💳 Setting up subscription...")
    plan, created = SubscriptionPlan.objects.get_or_create(
        name="Premium Plan",
        defaults={
            'description': 'Premium auto-apply plan for testing',
            'price': 29.99,
            'duration_days': 30,
            'daily_application_limit': 10,
            'features': ['auto_apply', 'email_tracking', 'priority_support'],
            'is_active': True
        }
    )
    if created:
        print(f"   ✅ Created subscription plan: {plan.name}")
    else:
        print(f"   ℹ️  Subscription plan exists: {plan.name}")
    
    # Assign subscription to user
    subscription, created = UserSubscription.objects.get_or_create(
        user=user,
        defaults={
            'plan': plan,
            'status': 'active'
        }
    )
    if created:
        print(f"   ✅ Assigned subscription to user: {plan.name}")
    else:
        print(f"   ℹ️  User already has subscription: {subscription.plan.name}")
    
    # 7. Create Google Integration
    print("🔗 Setting up Google Integration...")
    integration, created = GoogleIntegration.objects.get_or_create(
        user=user,
        defaults={
            'status': 'connected',  # Set as connected for demo
            'auto_apply_enabled': True,
            'google_email': user.email,
            'google_user_id': 'demo_google_id_123',
            'auto_apply_filters': {
                'job_categories': [cat.id for cat in user_categories],
                'locations': [location.id],
                'experience_level': ['entry', 'mid']
            }
        }
    )
    if created:
        print(f"   ✅ Created Google Integration for {user.email}")
        print(f"       Status: {integration.status}")
        print(f"       Auto Apply: {integration.auto_apply_enabled}")
    else:
        # Update existing integration
        integration.status = 'connected'
        integration.auto_apply_enabled = True
        integration.save()
        print(f"   ℹ️  Google Integration already exists - updated settings")
    
    # 8. Create test jobs at Technobits Digital
    print("💼 Creating test jobs at Technobits Digital...")
    test_jobs = [
        {
            'title': 'Full Stack Developer',
            'description': 'We are looking for a skilled Full Stack Developer to join our team...',
            'category': 'Full Stack Developer'
        },
        {
            'title': 'Backend Developer',
            'description': 'Join our backend development team and work on exciting projects...',
            'category': 'Backend Developer'
        },
        {
            'title': 'React Developer',
            'description': 'Looking for a React developer to build amazing user interfaces...',
            'category': 'Frontend Developer'
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
                'posted_by': user  # Using same user as poster for demo
            }
        )
        if created:
            created_jobs.append(job)
            print(f"   ✅ Created job: {job.title} at {company.name}")
        else:
            print(f"   ℹ️  Job already exists: {job.title}")
    
    print("\n✅ Setup Complete!")
    print("=" * 50)
    print(f"👤 User: {user.get_full_name()} ({user.email})")
    print(f"🏢 Company: {company.name} ({company.email})")
    print(f"📧 Gmail Connected: {integration.google_email}")
    print(f"🤖 Auto Apply Enabled: {integration.auto_apply_enabled}")
    print(f"💼 Test Jobs Created: {len(created_jobs)}")
    print(f"📋 Subscription: {subscription.plan.name} (Daily limit: {subscription.plan.daily_application_limit})")
    
    return user, company, integration, created_jobs

def trigger_auto_apply_demo(user):
    """
    Demonstrate triggering auto-apply for Darshan Patel
    """
    print("\n🚀 TRIGGERING AUTO-APPLY DEMO")
    print("=" * 50)
    
    try:
        # Trigger auto-apply task
        print("📤 Triggering auto-apply task...")
        result = trigger_auto_apply_for_user.delay(
            user.id,
            max_applications=3,  # Limit to 3 applications for demo
            filters=None  # Use default filters from integration
        )
        
        print(f"✅ Auto-apply task triggered!")
        print(f"   Task ID: {result.id}")
        print(f"   User: {user.email}")
        print(f"   Max Applications: 3")
        
        print("\n📋 What happens next:")
        print("1. Celery worker will process the task")
        print("2. System will find matching jobs based on user preferences")
        print("3. For each job, it will:")
        print("   - Check if user already applied")
        print("   - Verify company has email contact")
        print("   - Generate auto-application email")
        print("   - Send email from user's Gmail to company email")
        print("   - Track the application in database")
        
        print(f"\n📧 Email will be sent FROM: {user.email}")
        print(f"📧 Email will be sent TO: technobits@gmail.com")
        
        return result
        
    except Exception as e:
        print(f"❌ Error triggering auto-apply: {e}")
        return None

def check_auto_apply_status():
    """
    Check the status of auto-apply functionality
    """
    print("\n📊 AUTO-APPLY STATUS CHECK")
    print("=" * 50)
    
    try:
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        integration = GoogleIntegration.objects.get(user=user)
        
        print(f"👤 User: {user.get_full_name()} ({user.email})")
        print(f"🔗 Google Integration Status: {integration.status}")
        print(f"🤖 Auto Apply Enabled: {integration.auto_apply_enabled}")
        
        # Check recent auto-apply sessions
        from apps.google_integration.models import AutoApplySession
        recent_sessions = AutoApplySession.objects.filter(
            google_integration=integration
        ).order_by('-created_at')[:5]
        
        print(f"\n📋 Recent Auto-Apply Sessions: {recent_sessions.count()}")
        for session in recent_sessions:
            print(f"   Session {session.session_id}: {session.status}")
            print(f"   Jobs Found: {session.jobs_found}, Sent: {session.applications_sent}")
        
        # Check applied jobs
        from apps.applications.models import AutoAppliedJob
        auto_applications = AutoAppliedJob.objects.filter(user=user)
        print(f"\n📨 Auto-Applied Jobs: {auto_applications.count()}")
        for auto_app in auto_applications:
            print(f"   {auto_app.job.title} at {auto_app.job.company.name}")
            print(f"   Status: {auto_app.email_status}, To: {auto_app.company_email}")
        
    except Exception as e:
        print(f"❌ Error checking status: {e}")

if __name__ == "__main__":
    # Setup the environment
    user, company, integration, jobs = setup_darshan_auto_apply()
    
    # Show how to trigger auto-apply
    print("\n" + "="*50)
    print("🎯 AUTO-APPLY TRIGGER INSTRUCTIONS")
    print("="*50)
    print("To trigger auto-apply, you can:")
    print("1. Use the API endpoint: POST /api/google-integration/trigger-auto-apply/")
    print("2. Run the Celery task directly (as shown below)")
    print("3. Schedule it to run automatically")
    
    # Ask user if they want to trigger demo
    response = input("\nDo you want to trigger auto-apply demo now? (y/n): ")
    if response.lower() == 'y':
        trigger_auto_apply_demo(user)
        
        # Wait a moment and check status
        import time
        print("\nWaiting 5 seconds before checking status...")
        time.sleep(5)
        check_auto_apply_status()
    else:
        print("Demo not triggered. You can run it later using the API or Celery commands.")
    
    print(f"\n📝 Next Steps:")
    print(f"1. Ensure Redis is running: redis-server")
    print(f"2. Start Celery worker: celery -A Backend worker --loglevel=info")
    print(f"3. Start Celery beat (for scheduled tasks): celery -A Backend beat --loglevel=info")
    print(f"4. Use the frontend or API to trigger auto-apply for {user.email}") 