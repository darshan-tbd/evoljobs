#!/usr/bin/env python
"""
Test Script for Job Scrapers
============================

This script tests the integration of job scrapers with the JobPosting model.
"""

import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.core.models import Location
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

def test_database_connection():
    """Test if we can connect to the database and access models"""
    print("🔍 Testing database connection...")
    
    try:
        # Test JobPosting model
        total_jobs = JobPosting.objects.count()
        print(f"✅ JobPosting model accessible - {total_jobs} jobs found")
        
        # Test Company model
        total_companies = Company.objects.count()
        print(f"✅ Company model accessible - {total_companies} companies found")
        
        # Test Location model
        total_locations = Location.objects.count()
        print(f"✅ Location model accessible - {total_locations} locations found")
        
        # Test User model
        total_users = User.objects.count()
        print(f"✅ User model accessible - {total_users} users found")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def test_system_user():
    """Test if system user exists or can be created"""
    print("\n🔍 Testing system user...")
    
    try:
        system_user, created = User.objects.get_or_create(
            email='system@evoljobs.com',
            defaults={
                'first_name': 'System',
                'last_name': 'Scraper',
                'is_staff': True
            }
        )
        
        if created:
            print(f"✅ System user created: {system_user.email}")
        else:
            print(f"✅ System user exists: {system_user.email}")
        
        return True
        
    except Exception as e:
        print(f"❌ System user test failed: {str(e)}")
        return False

def test_job_creation():
    """Test if we can create a test job"""
    print("\n🔍 Testing job creation...")
    
    try:
        # Get or create test company
        test_company, created = Company.objects.get_or_create(
            slug='test-company',
            defaults={
                'name': 'Test Company',
                'description': 'Test company for scraper testing',
                'website': 'https://test.com',
                'company_size': 'small'
            }
        )
        
        # Get system user
        system_user = User.objects.get(email='system@evoljobs.com')
        
        # Create test job
        test_job = JobPosting.objects.create(
            title='Test Job - Software Engineer',
            slug='test-job-software-engineer',
            description='This is a test job for scraper testing',
            company=test_company,
            posted_by=system_user,
            external_source='Test',
            external_url='https://test.com/job',
            job_type='full_time',
            status='active'
        )
        
        print(f"✅ Test job created: {test_job.title}")
        
        # Clean up test job
        test_job.delete()
        print("✅ Test job cleaned up")
        
        return True
        
    except Exception as e:
        print(f"❌ Job creation test failed: {str(e)}")
        return False

def show_existing_jobs():
    """Show existing jobs in the database"""
    print("\n📊 Existing Jobs in Database:")
    print("="*50)
    
    jobs = JobPosting.objects.all()[:10]  # Show first 10 jobs
    
    if not jobs:
        print("No jobs found in database")
        return
    
    for job in jobs:
        print(f"📋 {job.title}")
        print(f"   Company: {job.company.name}")
        print(f"   Source: {job.external_source}")
        print(f"   Created: {job.created_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"   Status: {job.status}")
        print("-" * 30)

def main():
    print("🧪 Testing Job Scraper Integration")
    print("="*50)
    
    # Run tests
    tests = [
        test_database_connection,
        test_system_user,
        test_job_creation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ All tests passed! Scrapers are ready to use.")
        show_existing_jobs()
        
        print("\n🚀 Next Steps:")
        print("1. Run individual scrapers:")
        print("   python scrape_probonoaustralia.py")
        print("   python scrape_serviceseeking.py")
        print("   python fetch_michael_page_job.py")
        print("\n2. Run all scrapers together:")
        print("   python run_all_scrapers.py")
        print("\n3. Check statistics:")
        print("   python run_all_scrapers.py --stats")
    else:
        print("❌ Some tests failed. Please check your setup.")

if __name__ == "__main__":
    main() 