#!/usr/bin/env python
"""
Script to create test data for Auto Apply functionality
Creates Technobits company, test user, and test job as specified in requirements
"""

import os
import django
from django.utils.text import slugify

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.companies.models import Company
from apps.jobs.models import JobPosting, JobCategory
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from apps.core.models import Location, Industry
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def create_test_data():
    """Create all test data for Auto Apply functionality"""
    
    print("🔧 Creating test data for Auto Apply functionality...")
    
    # 1. Create or get job categories needed for test
    print("📝 Setting up job categories...")
    
    backend_dev_category, created = JobCategory.objects.get_or_create(
        name="Backend Developer",
        defaults={
            'slug': slugify("Backend Developer"),
            'description': "Backend software development positions",
            'keywords': 'backend,server,api,database,python,django,node,java,php'
        }
    )
    if created:
        print(f"   ✅ Created category: {backend_dev_category.name}")
    
    fullstack_dev_category, created = JobCategory.objects.get_or_create(
        name="Full Stack Developer",
        defaults={
            'slug': slugify("Full Stack Developer"),
            'description': "Full stack software development positions",
            'keywords': 'fullstack,full-stack,frontend,backend,react,angular,vue,javascript,python,django'
        }
    )
    if created:
        print(f"   ✅ Created category: {fullstack_dev_category.name}")
    
    software_engineer_category, created = JobCategory.objects.get_or_create(
        name="Software Engineer",
        defaults={
            'slug': slugify("Software Engineer"),
            'description': "General software engineering positions",
            'keywords': 'software,engineer,programming,development,coding,python,java,javascript'
        }
    )
    if created:
        print(f"   ✅ Created category: {software_engineer_category.name}")
    
    # 2. Create test location
    print("📍 Setting up test location...")
    location, created = Location.objects.get_or_create(
        name="Sydney, NSW, Australia",
        defaults={
            'city': 'Sydney',
            'state': 'NSW',
            'country': 'Australia'
        }
    )
    if created:
        print(f"   ✅ Created location: {location.name}")
    
    # 3. Create IT industry
    print("🏢 Setting up IT industry...")
    industry, created = Industry.objects.get_or_create(
        name="Information Technology",
        defaults={
            'description': 'Information Technology and Software'
        }
    )
    if created:
        print(f"   ✅ Created industry: {industry.name}")
    
    # 4. Create Technobits company
    print("🏭 Creating Technobits company...")
    company, created = Company.objects.get_or_create(
        name="Technobits",
        defaults={
            'slug': slugify("Technobits"),
            'description': 'Technobits is an innovative IT firm specializing in cutting-edge software solutions and digital transformation.',
            'website': 'https://technobits.com',
            'email': 'technobits@gmail.com',  # Test email as specified
            'phone': '5587548754',  # Test phone as specified
            'headquarters': location,
            'industry': industry,
            'company_size': 'medium',
            'founded_year': 2015,
            'is_verified': True,
            'is_featured': True
        }
    )
    if created:
        print(f"   ✅ Created company: {company.name} ({company.email})")
    else:
        print(f"   ℹ️  Company already exists: {company.name} ({company.email})")
    
    # 5. Create test user
    print("👤 Creating test user...")
    user, created = User.objects.get_or_create(
        email="vraj@gmail.com",
        defaults={
            'first_name': 'Vraj',
            'last_name': 'Patel',
            'user_type': 'job_seeker',
            'is_active': True,
            'is_verified': True
        }
    )
    
    if created:
        user.set_password("Vraj@123")  # Set the specified password
        user.save()
        print(f"   ✅ Created user: {user.get_full_name()} ({user.email})")
    else:
        print(f"   ℹ️  User already exists: {user.get_full_name()} ({user.email})")
    
    # 6. Set user's preferred job categories
    print("🎯 Setting user's preferred job categories...")
    user.preferred_job_categories.set([
        backend_dev_category,
        fullstack_dev_category,
        software_engineer_category
    ])
    print(f"   ✅ Set preferred categories: {[cat.name for cat in user.preferred_job_categories.all()]}")
    
    # 7. Create subscription plans if they don't exist
    print("💳 Setting up subscription plans...")
    
    free_plan, created = SubscriptionPlan.objects.get_or_create(
        name='Free Plan for Auto Apply Testing',
        defaults={
            'plan_type': 'free',
            'description': 'Basic job search functionality',
            'price': 0.00,
            'duration_days': 30,
            'daily_application_limit': 2,
            'features': ['Basic job search', 'Limited applications'],
            'is_active': True
        }
    )
    if created:
        print(f"   ✅ Created plan: {free_plan.name}")
    
    premium_plan, created = SubscriptionPlan.objects.get_or_create(
        name='Premium Plan for Auto Apply Testing',
        defaults={
            'plan_type': 'premium',
            'description': 'Advanced features including Auto Apply',
            'price': 29.99,
            'duration_days': 30,
            'daily_application_limit': 20,
            'features': ['Advanced job search', 'Auto Apply', 'Priority support'],
            'is_active': True,
            'priority_support': True,
            'advanced_analytics': True
        }
    )
    if created:
        print(f"   ✅ Created plan: {premium_plan.name}")
    
    # 8. Give test user a premium subscription
    print("🔥 Setting up user subscription...")
    
    # Check if user already has an active subscription
    existing_subscription = UserSubscription.objects.filter(
        user=user,
        status='active',
        end_date__gt=timezone.now()
    ).first()
    
    if not existing_subscription:
        subscription = UserSubscription.objects.create(
            user=user,
            plan=premium_plan,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status='active',
            auto_renew=True
        )
        print(f"   ✅ Created subscription: {subscription.plan.name} for {user.email}")
    else:
        print(f"   ℹ️  User already has active subscription: {existing_subscription.plan.name}")
    
    # 9. Create test job posting
    print("💼 Creating test job posting...")
    
    # Check if job already exists first
    existing_job = JobPosting.objects.filter(
        title="Full-Stack-Developer",
        company=company
    ).first()
    
    if existing_job:
        job = existing_job
        created = False
        print(f"   ℹ️  Job already exists: {job.title} at {job.company.name}")
    else:
        # Create job with minimal data to avoid notification issues
        try:
            job = JobPosting.objects.create(
                title="Full-Stack-Developer",  # Exact title as specified
                company=company,
                slug=slugify("Full-Stack-Developer-Technobits"),
                description='''We are looking for a talented Full Stack Developer to join our dynamic team at Technobits. 

Key Responsibilities:
- Develop and maintain web applications using modern technologies
- Work with both frontend and backend technologies
- Collaborate with cross-functional teams

Requirements:
- 3+ years of experience in full stack development
- Proficiency in JavaScript, Python, React, Django
- Experience with databases (PostgreSQL, MongoDB)

What we offer:
- Competitive salary package
- Flexible working arrangements
- Professional development opportunities'''.strip(),
                job_category=fullstack_dev_category,
                job_type='full_time',
                experience_level='mid',
                remote_option='hybrid',
                location=location,
                salary_min=70000,
                salary_max=95000,
                salary_currency='AUD',
                salary_type='yearly',
                requirements='JavaScript, Python, React, Django, PostgreSQL, 3+ years experience',
                benefits='Health insurance, Flexible hours, Professional development, Remote work options',
                status='active',
                is_featured=True,
                application_email=company.email,  # Use company email for applications
                external_source='manual',
                posted_by=user  # Use test user as the poster for now
            )
            created = True
        except Exception as e:
            print(f"   ❌ Error creating job: {e}")
            # Try to find any existing job for Technobits
            job = JobPosting.objects.filter(company=company).first()
            if job:
                print(f"   ℹ️  Using existing job: {job.title}")
                created = False
            else:
                raise e
    
    if created:
        print(f"   ✅ Created job: {job.title} at {job.company.name}")
        print(f"      Category: {job.job_category.name}")
        print(f"      Application Email: {job.application_email}")
    else:
        print(f"   ℹ️  Job already exists: {job.title} at {job.company.name}")
    
    print("\n🎉 Test data creation completed!")
    print("\n📋 Summary:")
    print(f"   🏢 Company: {company.name} ({company.email})")
    print(f"   👤 User: {user.get_full_name()} ({user.email})")
    print(f"   🎯 User Categories: {[cat.name for cat in user.preferred_job_categories.all()]}")
    print(f"   💼 Job: {job.title} ({job.job_category.name})")
    print(f"   💳 Subscription: {UserSubscription.objects.filter(user=user, status='active').first().plan.name if UserSubscription.objects.filter(user=user, status='active').exists() else 'None'}")
    
    print("\n🚀 Ready for Auto Apply testing!")
    print("   Note: Make sure to set up Google Integration for the test user to enable Auto Apply.")

if __name__ == "__main__":
    create_test_data() 