#!/usr/bin/env python
"""
Test script to verify dashboard API endpoints
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

User = get_user_model()

def test_dashboard_api():
    """Test the dashboard API endpoints"""
    
    print("🧪 Testing Dashboard API Endpoints")
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
        
        # Test all dashboard endpoints
        endpoints = [
            {
                'name': 'Users Stats',
                'url': 'http://127.0.0.1:8000/api/v1/users/admin-users/stats/',
                'expected_fields': ['total', 'active', 'new_today', 'new_week', 'by_type']
            },
            {
                'name': 'Companies Stats',
                'url': 'http://127.0.0.1:8000/api/v1/companies/admin-companies/stats/',
                'expected_fields': ['total_companies', 'verified_companies', 'recent_activity']
            },
            {
                'name': 'Jobs Stats',
                'url': 'http://127.0.0.1:8000/api/v1/jobs/admin-jobs/stats/',
                'expected_fields': ['total_jobs', 'active_jobs', 'recent_activity']
            },
            {
                'name': 'Applications Stats',
                'url': 'http://127.0.0.1:8000/api/v1/applications/admin-applications/stats/',
                'expected_fields': ['total_applications', 'recent_activity']
            },
            {
                'name': 'Scrapers Stats',
                'url': 'http://127.0.0.1:8000/api/v1/scrapers/stats/',
                'expected_fields': ['total_jobs', 'jobs_by_source', 'recent_activity']
            },
        ]
        
        for endpoint in endpoints:
            print(f"\n📊 Testing {endpoint['name']}...")
            
            try:
                response = requests.get(endpoint['url'], headers=headers)
                print(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ {endpoint['name']} endpoint working")
                    print(f"Response data: {json.dumps(data, indent=2)}")
                    
                    # Check if expected fields are present
                    missing_fields = []
                    for field in endpoint['expected_fields']:
                        if field not in data:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        print(f"⚠️ Missing fields: {missing_fields}")
                    else:
                        print(f"✅ All expected fields present")
                        
                else:
                    print(f"❌ {endpoint['name']} failed: {response.status_code}")
                    print(f"Error: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error testing {endpoint['name']}: {str(e)}")
        
        print("\n🎉 Dashboard API testing completed!")
        
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")

def check_database_state():
    """Check the current state of the database"""
    print("\n🔍 Checking Database State:")
    print("=" * 30)
    
    all_users = User.objects.all()
    print(f"Total users: {all_users.count()}")
    
    active_users = User.objects.filter(is_active=True)
    print(f"Active users: {active_users.count()}")
    
    job_seekers = User.objects.filter(user_type='job_seeker')
    print(f"Job seekers: {job_seekers.count()}")
    
    employers = User.objects.filter(user_type='employer')
    print(f"Employers: {employers.count()}")
    
    admins = User.objects.filter(user_type='admin')
    print(f"Admins: {admins.count()}")
    
    deleted_users = User.objects.filter(is_deleted=True)
    print(f"Soft-deleted users: {deleted_users.count()}")

if __name__ == '__main__':
    check_database_state()
    test_dashboard_api() 