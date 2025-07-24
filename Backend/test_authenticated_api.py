#!/usr/bin/env python
"""
Test script to check API endpoints with authentication
"""
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.users.models import User
from rest_framework_simplejwt.tokens import AccessToken

def test_authenticated_api():
    print("=== Testing Authenticated API Endpoints ===")
    
    # Get a user
    user = User.objects.first()
    if not user:
        print("No users found!")
        return
    
    print(f"Testing with user: {user.email}")
    
    # Create access token
    access_token = AccessToken.for_user(user)
    token_string = str(access_token)
    print(f"Generated access token: {token_string[:20]}...")
    
    # Test applications endpoint
    print("\n--- Testing Applications API ---")
    headers = {
        'Authorization': f'Bearer {token_string}',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.get('http://127.0.0.1:8000/api/v1/applications/applications/', headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {list(data.keys())}")
            print(f"Total applications: {data.get('count', 0)}")
            print(f"Results count: {len(data.get('results', []))}")
            
            if data.get('results'):
                app = data['results'][0]
                print(f"Sample application:")
                print(f"  ID: {app.get('id')}")
                print(f"  Job Title: {app.get('job_title')}")
                print(f"  Company: {app.get('job_company_name')}")
                print(f"  Status: {app.get('status')}")
                print(f"  Applied: {app.get('applied_at')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing applications API: {e}")
    
    # Test saved jobs endpoint
    print("\n--- Testing Saved Jobs API ---")
    try:
        response = requests.get('http://127.0.0.1:8000/api/v1/jobs/saved-jobs/', headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {list(data.keys())}")
            print(f"Total saved jobs: {data.get('count', 0)}")
            print(f"Results count: {len(data.get('results', []))}")
            
            if data.get('results'):
                saved_job = data['results'][0]
                print(f"Sample saved job:")
                print(f"  ID: {saved_job.get('id')}")
                job_data = saved_job.get('job', {})
                print(f"  Job Title: {job_data.get('title')}")
                print(f"  Company: {job_data.get('company', {}).get('name')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing saved jobs API: {e}")
    
    # Test AI stats endpoint
    print("\n--- Testing AI Stats API ---")
    try:
        response = requests.get('http://127.0.0.1:8000/api/v1/ai/matching_stats/', headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"AI Stats response: {data}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing AI stats API: {e}")

if __name__ == "__main__":
    test_authenticated_api() 