#!/usr/bin/env python
"""
Test Admin Dashboard API Endpoints
==================================

This script tests the admin dashboard API endpoints to ensure they're working correctly.
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Django setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.core.models import Location

User = get_user_model()

def create_test_admin_user():
    """Create a test admin user if it doesn't exist"""
    try:
        admin_user = User.objects.get(email='admin@evoljobs.com')
        print(f"✅ Admin user already exists: {admin_user.email}")
        return admin_user
    except User.DoesNotExist:
        admin_user = User.objects.create_user(
            email='admin@evoljobs.com',
            password='admin123',
            first_name='Admin',
            last_name='User',
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )
        print(f"✅ Created admin user: {admin_user.email}")
        return admin_user

def get_auth_token(email, password):
    """Get authentication token"""
    try:
        response = requests.post('http://127.0.0.1:8000/api/v1/auth/login/', {
            'email': email,
            'password': password
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
        else:
            print(f"❌ Login failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting auth token: {str(e)}")
        return None

def test_api_endpoint(url, token, name):
    """Test an API endpoint"""
    try:
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name}: Success")
            print(f"   Status: {response.status_code}")
            print(f"   Data keys: {list(data.keys())}")
            return True
        else:
            print(f"❌ {name}: Failed")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ {name}: Error - {str(e)}")
        return False

def test_scraper_endpoints(token):
    """Test scraper-specific endpoints"""
    base_url = 'http://127.0.0.1:8000/api/v1/scrapers'
    
    endpoints = [
        (f'{base_url}/stats/', 'Scraper Stats'),
        (f'{base_url}/status/', 'Scraper Status'),
        (f'{base_url}/recent-jobs/', 'Recent Scraped Jobs'),
        (f'{base_url}/logs/', 'Scraper Logs'),
    ]
    
    print("\n🔍 Testing Scraper Endpoints:")
    print("=" * 50)
    
    for url, name in endpoints:
        test_api_endpoint(url, token, name)
        print()

def test_dashboard_endpoints(token):
    """Test dashboard endpoints"""
    endpoints = [
        ('http://127.0.0.1:8000/api/v1/users/admin-users/stats/', 'User Stats'),
        ('http://127.0.0.1:8000/api/v1/companies/admin-companies/stats/', 'Company Stats'),
        ('http://127.0.0.1:8000/api/v1/jobs/admin-jobs/stats/', 'Job Stats'),
        ('http://127.0.0.1:8000/api/v1/applications/admin-applications/stats/', 'Application Stats'),
    ]
    
    print("\n📊 Testing Dashboard Endpoints:")
    print("=" * 50)
    
    for url, name in endpoints:
        test_api_endpoint(url, token, name)
        print()

def test_scraper_run(token):
    """Test running a scraper"""
    try:
        url = 'http://127.0.0.1:8000/api/v1/scrapers/run/michael-page/'
        headers = {'Authorization': f'Bearer {token}'}
        
        print("\n🚀 Testing Scraper Run:")
        print("=" * 50)
        
        response = requests.post(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Scraper Run: Success")
            print(f"   Status: {response.status_code}")
            print(f"   Message: {data.get('message')}")
            print(f"   Scraper ID: {data.get('scraper_id')}")
            return True
        else:
            print(f"❌ Scraper Run: Failed")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Scraper Run: Error - {str(e)}")
        return False

def check_database_data():
    """Check if there's data in the database"""
    print("\n🗄️  Database Data Check:")
    print("=" * 50)
    
    try:
        # Check users
        user_count = User.objects.count()
        admin_count = User.objects.filter(user_type='admin').count()
        print(f"✅ Users: {user_count} total, {admin_count} admins")
        
        # Check companies
        company_count = Company.objects.count()
        print(f"✅ Companies: {company_count}")
        
        # Check jobs
        job_count = JobPosting.objects.count()
        scraped_jobs = JobPosting.objects.filter(external_source__isnull=False).count()
        print(f"✅ Jobs: {job_count} total, {scraped_jobs} scraped")
        
        # Check locations
        location_count = Location.objects.count()
        print(f"✅ Locations: {location_count}")
        
        return True
    except Exception as e:
        print(f"❌ Database check failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🧪 Admin Dashboard API Test")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Create test admin user
    admin_user = create_test_admin_user()
    
    # Get authentication token
    print("\n🔐 Getting Authentication Token:")
    print("=" * 50)
    token = get_auth_token('admin@evoljobs.com', 'admin123')
    
    if not token:
        print("❌ Failed to get authentication token. Exiting.")
        return
    
    print(f"✅ Authentication token obtained")
    
    # Check database data
    check_database_data()
    
    # Test dashboard endpoints
    test_dashboard_endpoints(token)
    
    # Test scraper endpoints
    test_scraper_endpoints(token)
    
    # Test scraper run (optional - uncomment if you want to test)
    # test_scraper_run(token)
    
    print("\n🎉 Admin Dashboard API Test Complete!")
    print("=" * 60)

if __name__ == '__main__':
    main() 