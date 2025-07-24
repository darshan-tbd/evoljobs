#!/usr/bin/env python
"""
Test script to verify admin API endpoints
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
from apps.users.models import UserProfile, UserExperience, UserEducation

User = get_user_model()

def test_admin_api():
    """Test the admin API endpoints"""
    
    print("🧪 Testing Admin API Endpoints")
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
        
        # Test users endpoint
        print("\n📋 Testing users endpoint...")
        users_response = requests.get(
            'http://127.0.0.1:8000/api/v1/users/admin-users/',
            headers=headers
        )
        
        print(f"Users response status: {users_response.status_code}")
        if users_response.status_code == 200:
            users_data = users_response.json()
            print(f"Users response structure: {type(users_data)}")
            if isinstance(users_data, dict):
                print(f"Users response keys: {users_data.keys()}")
                if 'results' in users_data:
                    users = users_data['results']
                    print(f"Number of users: {len(users)}")
                    for user in users[:3]:  # Show first 3 users
                        print(f"  - {user.get('email')} ({user.get('user_type')}) - is_deleted: {user.get('is_deleted', False)}")
                else:
                    print(f"Users data: {users_data}")
            else:
                print(f"Users data: {users_data}")
        else:
            print(f"❌ Users endpoint failed: {users_response.text}")
        
        # Test stats endpoint
        print("\n📊 Testing stats endpoint...")
        stats_response = requests.get(
            'http://127.0.0.1:8000/api/v1/users/admin-users/stats/',
            headers=headers
        )
        
        print(f"Stats response status: {stats_response.status_code}")
        if stats_response.status_code == 200:
            stats_data = stats_response.json()
            print(f"Stats response: {json.dumps(stats_data, indent=2)}")
        else:
            print(f"❌ Stats endpoint failed: {stats_response.text}")
        
        # Test toggle endpoints
        print("\n🔄 Testing toggle endpoints...")
        
        # Get a test user for toggling
        if users_response.status_code == 200:
            users_data = users_response.json()
            if isinstance(users_data, dict) and 'results' in users_data:
                users = users_data['results']
                if users:
                    test_user = users[0]
                    user_id = test_user['id']
                    
                    print(f"Testing with user: {test_user['email']}")
                    
                    # Test toggle active
                    toggle_active_response = requests.patch(
                        f'http://127.0.0.1:8000/api/v1/users/admin-users/{user_id}/toggle_active/',
                        headers=headers
                    )
                    print(f"Toggle active response: {toggle_active_response.status_code}")
                    
                    # Test toggle verified
                    toggle_verified_response = requests.patch(
                        f'http://127.0.0.1:8000/api/v1/users/admin-users/{user_id}/toggle_verified/',
                        headers=headers
                    )
                    print(f"Toggle verified response: {toggle_verified_response.status_code}")
        
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")

def check_database_state():
    """Check the current state of the database"""
    print("\n🔍 Checking Database State:")
    print("=" * 30)
    
    all_users = User.objects.all()
    print(f"Total users in database: {all_users.count()}")
    
    active_users = User.objects.filter(is_active=True)
    print(f"Active users: {active_users.count()}")
    
    verified_users = User.objects.filter(is_verified=True)
    print(f"Verified users: {verified_users.count()}")
    
    job_seekers = User.objects.filter(user_type='job_seeker')
    print(f"Job seekers: {job_seekers.count()}")
    
    employers = User.objects.filter(user_type='employer')
    print(f"Employers: {employers.count()}")
    
    admins = User.objects.filter(user_type='admin')
    print(f"Admins: {admins.count()}")
    
    deleted_users = User.objects.filter(is_deleted=True)
    print(f"Soft-deleted users: {deleted_users.count()}")
    
    print("\nUser details:")
    for user in all_users:
        print(f"  - {user.email} ({user.user_type}) - Active: {user.is_active}, Verified: {user.is_verified}, Deleted: {user.is_deleted}")

if __name__ == '__main__':
    check_database_state()
    test_admin_api() 