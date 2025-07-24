#!/usr/bin/env python
"""
Debug script to test the apply flow with darshan@gmail.com
"""
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.users.models import User
from apps.jobs.models import JobPosting
from apps.applications.models import JobApplication
from rest_framework_simplejwt.tokens import AccessToken

def debug_apply_flow():
    print("=== Debugging Apply Flow ===")
    
    # Check if darshan@gmail.com exists
    user = User.objects.filter(email='darshan@gmail.com').first()
    if not user:
        print("❌ User darshan@gmail.com not found!")
        return
    
    print(f"✅ Found user: {user.email}")
    print(f"   - ID: {user.id}")
    print(f"   - Is staff: {user.is_staff}")
    print(f"   - Is active: {user.is_active}")
    
    # Check existing applications
    existing_applications = JobApplication.objects.filter(applicant=user)
    print(f"\n📊 Current applications: {existing_applications.count()}")
    for app in existing_applications:
        print(f"   - {app.job.title} (Status: {app.status})")
    
    # Get available jobs to apply to
    user_applied_jobs = JobApplication.objects.filter(applicant=user).values_list('job_id', flat=True)
    available_jobs = JobPosting.objects.exclude(id__in=user_applied_jobs)
    
    print(f"\n📋 Available jobs to apply to: {available_jobs.count()}")
    for job in available_jobs[:5]:  # Show first 5
        print(f"   - {job.title} (ID: {job.id})")
    
    if not available_jobs.exists():
        print("❌ No jobs available to apply to!")
        return
    
    # Test quick apply API
    job = available_jobs.first()
    print(f"\n🧪 Testing quick apply to: {job.title}")
    
    # Create access token
    access_token = AccessToken.for_user(user)
    token_string = str(access_token)
    print(f"🔑 Generated token: {token_string[:20]}...")
    
    # Test API call
    headers = {
        'Authorization': f'Bearer {token_string}',
        'Content-Type': 'application/json',
    }
    
    payload = {
        'job_id': str(job.id)
    }
    
    print(f"📤 Sending request to: /api/v1/applications/applications/quick_apply/")
    print(f"📦 Payload: {payload}")
    
    try:
        response = requests.post('http://127.0.0.1:8000/api/v1/applications/applications/quick_apply/', 
                               headers=headers, json=payload)
        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response body: {response.text}")
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Application created successfully!")
            print(f"   - Application ID: {data['application']['id']}")
            
            # Verify in database
            new_app = JobApplication.objects.filter(id=data['application']['id']).first()
            if new_app:
                print(f"✅ Verified in database: {new_app.job.title}")
            else:
                print("❌ Not found in database!")
        else:
            print("❌ Failed to create application")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_apply_flow() 