#!/usr/bin/env python
"""
Test script to verify job management API endpoints
"""
import os
import sys
import django
import requests
import json

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.core.models import Location, Industry, Skill

User = get_user_model()

def test_job_management_api():
    """Test the job management API endpoints"""
    
    print("🧪 Testing Job Management API Endpoints")
    print("=" * 50)
    
    # First, let's get an admin token
    admin_credentials = {'email': 'admin@gmail.com', 'password': 'admin'}
    
    try:
        print("🔐 Logging in as admin...")
        login_response = requests.post(
            'http://127.0.0.1:8000/api/v1/auth/login/',
            json=admin_credentials,
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            return
        
        token_data = login_response.json()
        access_token = token_data.get('tokens', {}).get('access')
        
        if not access_token:
            print("❌ No access token received")
            return
        
        print("✅ Admin login successful")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Test job management endpoints
        endpoints = [
            {
                'name': 'Jobs List',
                'url': 'http://127.0.0.1:8000/api/v1/jobs/admin-jobs/',
                'method': 'GET'
            },
            {
                'name': 'Jobs Stats',
                'url': 'http://127.0.0.1:8000/api/v1/jobs/admin-jobs/stats/',
                'method': 'GET'
            },
            {
                'name': 'Recent Jobs Activity',
                'url': 'http://127.0.0.1:8000/api/v1/jobs/admin-jobs/recent_activity/',
                'method': 'GET'
            },
        ]
        
        for endpoint in endpoints:
            print(f"\n📊 Testing {endpoint['name']}...")
            
            try:
                response = requests.request(
                    endpoint['method'], 
                    endpoint['url'], 
                    headers=headers
                )
                print(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ {endpoint['name']} endpoint working")
                    
                    if endpoint['name'] == 'Jobs List':
                        print(f"Total jobs: {data.get('count', 0)}")
                        if data.get('results'):
                            job = data['results'][0]
                            print(f"Sample job fields: {list(job.keys())}")
                    elif endpoint['name'] == 'Jobs Stats':
                        print(f"Stats data: {json.dumps(data, indent=2)}")
                    elif endpoint['name'] == 'Recent Jobs Activity':
                        print(f"Recent activity: {data.get('recent_jobs', [])}")
                        
                else:
                    print(f"❌ {endpoint['name']} failed: {response.status_code}")
                    print(f"Error: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error testing {endpoint['name']}: {str(e)}")
        
        # Test job actions if we have jobs
        print("\n🔧 Testing Job Actions...")
        jobs_response = requests.get('http://127.0.0.1:8000/api/v1/jobs/admin-jobs/', headers=headers)
        
        if jobs_response.status_code == 200:
            jobs_data = jobs_response.json()
            if jobs_data.get('results'):
                job = jobs_data['results'][0]
                job_slug = job.get('slug')
                
                if job_slug:
                    print(f"Testing actions on job: {job.get('title')}")
                    
                    # Test toggle featured
                    toggle_response = requests.patch(
                        f'http://127.0.0.1:8000/api/v1/jobs/admin-jobs/{job_slug}/toggle_featured/',
                        headers=headers
                    )
                    print(f"Toggle featured status: {toggle_response.status_code}")
                    
                    # Test update status
                    status_response = requests.patch(
                        f'http://127.0.0.1:8000/api/v1/jobs/admin-jobs/{job_slug}/update_status/',
                        json={'status': 'active'},
                        headers=headers
                    )
                    print(f"Update status response: {status_response.status_code}")
        
        print("\n🎉 Job Management API testing completed!")
        
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")

def check_database_state():
    """Check the current state of the database"""
    print("\n🔍 Checking Database State:")
    print("=" * 30)
    
    all_jobs = JobPosting.objects.all()
    print(f"Total jobs: {all_jobs.count()}")
    
    active_jobs = JobPosting.objects.filter(status='active')
    print(f"Active jobs: {active_jobs.count()}")
    
    draft_jobs = JobPosting.objects.filter(status='draft')
    print(f"Draft jobs: {draft_jobs.count()}")
    
    featured_jobs = JobPosting.objects.filter(is_featured=True)
    print(f"Featured jobs: {featured_jobs.count()}")
    
    remote_jobs = JobPosting.objects.filter(remote_option='remote')
    print(f"Remote jobs: {remote_jobs.count()}")
    
    # Check job types
    job_types = JobPosting.objects.values_list('job_type', flat=True).distinct()
    print(f"Job types: {list(job_types)}")
    
    # Check experience levels
    experience_levels = JobPosting.objects.values_list('experience_level', flat=True).distinct()
    print(f"Experience levels: {list(experience_levels)}")

def create_test_jobs():
    """Create some test jobs if none exist"""
    print("\n🏭 Creating Test Jobs...")
    print("=" * 30)
    
    if JobPosting.objects.count() == 0:
        print("No jobs found, creating test jobs...")
        
        # Get or create required objects
        user, _ = User.objects.get_or_create(
            email='admin@gmail.com',
            defaults={'username': 'admin', 'is_staff': True, 'is_superuser': True}
        )
        
        company, _ = Company.objects.get_or_create(
            name='Test Company',
            defaults={'description': 'A test company', 'is_verified': True}
        )
        
        location, _ = Location.objects.get_or_create(
            name='Test Location',
            defaults={'city': 'Test City', 'state': 'Test State', 'country': 'Test Country'}
        )
        
        industry, _ = Industry.objects.get_or_create(
            name='Technology',
            defaults={'description': 'Technology industry'}
        )
        
        skill, _ = Skill.objects.get_or_create(
            name='Python',
            defaults={'category': 'Programming'}
        )
        
        # Create test jobs
        test_jobs = [
            {
                'title': 'Senior Python Developer',
                'description': 'We are looking for a senior Python developer...',
                'job_type': 'full_time',
                'experience_level': 'senior',
                'remote_option': 'remote',
                'status': 'active',
                'is_featured': True,
            },
            {
                'title': 'Junior Frontend Developer',
                'description': 'Entry level frontend development position...',
                'job_type': 'full_time',
                'experience_level': 'entry',
                'remote_option': 'hybrid',
                'status': 'active',
                'is_featured': False,
            },
            {
                'title': 'DevOps Engineer',
                'description': 'DevOps engineer for cloud infrastructure...',
                'job_type': 'contract',
                'experience_level': 'mid',
                'remote_option': 'onsite',
                'status': 'draft',
                'is_featured': False,
            },
        ]
        
        for job_data in test_jobs:
            job = JobPosting.objects.create(
                title=job_data['title'],
                slug=f"{job_data['title'].lower().replace(' ', '-')}-{JobPosting.objects.count() + 1}",
                description=job_data['description'],
                company=company,
                posted_by=user,
                location=location,
                industry=industry,
                job_type=job_data['job_type'],
                experience_level=job_data['experience_level'],
                remote_option=job_data['remote_option'],
                status=job_data['status'],
                is_featured=job_data['is_featured'],
                requirements='Strong programming skills required',
                qualifications='Bachelor degree preferred',
                benefits='Health insurance, flexible hours',
                salary_min=50000,
                salary_max=100000,
                salary_currency='USD',
                salary_type='yearly',
            )
            job.required_skills.add(skill)
            print(f"Created job: {job.title}")
    else:
        print(f"Found {JobPosting.objects.count()} existing jobs")

if __name__ == '__main__':
    check_database_state()
    create_test_jobs()
    test_job_management_api() 