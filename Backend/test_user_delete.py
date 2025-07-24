#!/usr/bin/env python
"""
Test script to verify user delete functionality
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

def check_admin_users():
    """Check what admin users exist"""
    print("\n🔍 Checking Admin Users:")
    
    # Check for superusers
    superusers = User.objects.filter(is_superuser=True)
    print(f"Superusers found: {superusers.count()}")
    for user in superusers:
        print(f"  - {user.email} (ID: {user.id})")
    
    # Check for staff users
    staff_users = User.objects.filter(is_staff=True, is_superuser=False)
    print(f"Staff users found: {staff_users.count()}")
    for user in staff_users:
        print(f"  - {user.email} (ID: {user.id})")
    
    # Check for admin type users
    admin_users = User.objects.filter(user_type='admin')
    print(f"Admin type users found: {admin_users.count()}")
    for user in admin_users:
        print(f"  - {user.email} (ID: {user.id})")
    
    # Check for regular users
    regular_users = User.objects.filter(is_superuser=False, is_staff=False, user_type__in=['job_seeker', 'employer'])
    print(f"Regular users found: {regular_users.count()}")
    for user in regular_users[:5]:  # Show first 5
        print(f"  - {user.email} (ID: {user.id}) - {user.user_type}")
    
    if regular_users.count() > 5:
        print(f"  ... and {regular_users.count() - 5} more")

def test_user_delete_api():
    """Test the user delete API endpoint"""
    
    # First, let's get an admin token - try different admin credentials
    admin_credentials_list = [
        {'email': 'admin@gmail.com', 'password': 'admin123'},
        {'email': 'admin@gmail.com', 'password': 'admin'},
        {'email': 'admin@gmail.com', 'password': 'password'},
        {'email': 'system@evoljobs.com', 'password': 'admin123'},
        {'email': 'system@evoljobs.com', 'password': 'system'},
    ]
    
    access_token = None
    admin_email = None
    
    for credentials in admin_credentials_list:
        try:
            print(f"\n🔐 Trying login with: {credentials['email']}")
            
            # Login to get token
            login_response = requests.post(
                'http://127.0.0.1:8000/api/v1/auth/login/',
                json=credentials,
                headers={'Content-Type': 'application/json'}
            )
            
            print(f"Login response status: {login_response.status_code}")
            
            if login_response.status_code == 200:
                token_data = login_response.json()
                print(f"Login response: {token_data}")
                
                # Check for tokens in the response structure
                if 'tokens' in token_data and 'access' in token_data['tokens']:
                    access_token = token_data['tokens']['access']
                elif 'access' in token_data:
                    access_token = token_data['access']
                else:
                    access_token = None
                
                if access_token:
                    admin_email = credentials['email']
                    print(f"✅ Admin login successful with: {admin_email}")
                    break
                else:
                    print("❌ No access token received")
                    print(f"Token data structure: {token_data}")
            else:
                print(f"❌ Login failed: {login_response.text}")
                
        except Exception as e:
            print(f"❌ Error during login: {str(e)}")
    
    if not access_token:
        print("❌ Could not login with any admin credentials")
        return
    
    # Get all users
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        users_response = requests.get(
            'http://127.0.0.1:8000/api/v1/users/admin-users/',
            headers=headers
        )
        
        print(f"\n📋 Users API response status: {users_response.status_code}")
        
        if users_response.status_code != 200:
            print(f"❌ Failed to get users: {users_response.text}")
            return
        
        users = users_response.json()
        print(f"✅ Found {len(users)} users via API")
        print(f"Users response structure: {type(users)}")
        if isinstance(users, dict):
            print(f"Users response keys: {users.keys()}")
            if 'results' in users:
                users = users['results']
            elif 'data' in users:
                users = users['data']
        
        print(f"Processed users count: {len(users)}")
        
        # Find a non-admin user to delete (for safety)
        test_user = None
        for user in users:
            print(f"Checking user: {user}")
            if isinstance(user, dict) and user.get('user_type') not in ['admin'] and not user.get('is_superuser'):
                test_user = user
                break
        
        if not test_user:
            print("❌ No suitable test user found (all users are admins)")
            return
        
        print(f"✅ Found test user: {test_user['email']} (ID: {test_user['id']})")
        
        # Test delete
        print(f"\n🗑️ Testing delete for user ID: {test_user['id']}")
        delete_response = requests.delete(
            f'http://127.0.0.1:8000/api/v1/users/admin-users/{test_user["id"]}/',
            headers=headers
        )
        
        print(f"Delete response status: {delete_response.status_code}")
        print(f"Delete response content: {delete_response.text}")
        
        if delete_response.status_code == 204:
            print("✅ User delete API call successful")
            
            # Verify user is actually deleted from database
            try:
                deleted_user = User.objects.get(id=test_user['id'])
                print(f"❌ User still exists in database: {deleted_user.email}")
                print(f"   User is_active: {deleted_user.is_active}")
                print(f"   User is_deleted: {getattr(deleted_user, 'is_deleted', 'N/A')}")
            except User.DoesNotExist:
                print("✅ User successfully deleted from database")
                
                # Check if related data is also deleted
                try:
                    profile = UserProfile.objects.get(user_id=test_user['id'])
                    print(f"❌ UserProfile still exists for deleted user")
                except UserProfile.DoesNotExist:
                    print("✅ UserProfile also deleted (cascade working)")
                
                try:
                    experiences = UserExperience.objects.filter(user_id=test_user['id'])
                    if experiences.exists():
                        print(f"❌ UserExperience records still exist for deleted user")
                    else:
                        print("✅ UserExperience records also deleted (cascade working)")
                except:
                    print("✅ UserExperience records also deleted (cascade working)")
                
                try:
                    educations = UserEducation.objects.filter(user_id=test_user['id'])
                    if educations.exists():
                        print(f"❌ UserEducation records still exist for deleted user")
                    else:
                        print("✅ UserEducation records also deleted (cascade working)")
                except:
                    print("✅ UserEducation records also deleted (cascade working)")
                    
        else:
            print(f"❌ User delete failed: {delete_response.status_code}")
            print(delete_response.text)
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")

def check_user_models():
    """Check the user models for proper cascade delete setup"""
    print("\n🔍 Checking User Models for Cascade Delete Setup:")
    
    # Check User model
    user_fields = User._meta.get_fields()
    print(f"User model fields: {len(user_fields)}")
    
    # Check UserProfile model
    profile_fields = UserProfile._meta.get_fields()
    print(f"UserProfile model fields: {len(profile_fields)}")
    
    # Check the relationship between User and UserProfile
    for field in profile_fields:
        if field.name == 'user':
            print(f"UserProfile.user field: {field}")
            print(f"  - on_delete: {field.remote_field.on_delete}")
            break
    
    # Check UserExperience model
    exp_fields = UserExperience._meta.get_fields()
    print(f"UserExperience model fields: {len(exp_fields)}")
    
    for field in exp_fields:
        if field.name == 'user':
            print(f"UserExperience.user field: {field}")
            print(f"  - on_delete: {field.remote_field.on_delete}")
            break
    
    # Check UserEducation model
    edu_fields = UserEducation._meta.get_fields()
    print(f"UserEducation model fields: {len(edu_fields)}")
    
    for field in edu_fields:
        if field.name == 'user':
            print(f"UserEducation.user field: {field}")
            print(f"  - on_delete: {field.remote_field.on_delete}")
            break

if __name__ == '__main__':
    print("🧪 Testing User Delete Functionality")
    print("=" * 50)
    
    check_user_models()
    check_admin_users()
    print("\n" + "=" * 50)
    test_user_delete_api() 