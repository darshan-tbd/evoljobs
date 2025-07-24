#!/usr/bin/env python
"""
Test script to check dashboard data
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.applications.models import JobApplication
from apps.jobs.models import SavedJob, JobPosting
from apps.users.models import User
from apps.applications.serializers import JobApplicationSerializer
from apps.jobs.serializers import SavedJobSerializer

def test_dashboard_data():
    print("=== Testing Dashboard Data ===")
    
    # Get a user
    user = User.objects.first()
    if not user:
        print("No users found!")
        return
    
    print(f"Testing with user: {user.email}")
    
    # Test applications
    print("\n--- Applications ---")
    applications = JobApplication.objects.filter(applicant=user)
    print(f"Total applications: {applications.count()}")
    
    for app in applications[:3]:
        print(f"Application ID: {app.id}")
        print(f"  Job: {app.job.title if app.job else 'No job'}")
        print(f"  Company: {app.job.company.name if app.job and app.job.company else 'No company'}")
        print(f"  Status: {app.status}")
        print(f"  Applied: {app.applied_at}")
        
        # Test serializer
        serializer = JobApplicationSerializer(app)
        data = serializer.data
        print(f"  Serialized job_title: {data.get('job_title', 'Not found')}")
        print(f"  Serialized job_company_name: {data.get('job_company_name', 'Not found')}")
        print()
    
    # Test saved jobs
    print("\n--- Saved Jobs ---")
    saved_jobs = SavedJob.objects.filter(user=user)
    print(f"Total saved jobs: {saved_jobs.count()}")
    
    for saved_job in saved_jobs[:3]:
        print(f"Saved Job ID: {saved_job.id}")
        print(f"  Job: {saved_job.job.title if saved_job.job else 'No job'}")
        print(f"  Company: {saved_job.job.company.name if saved_job.job and saved_job.job.company else 'No company'}")
        print(f"  Location: {saved_job.job.location.name if saved_job.job and saved_job.job.location else 'No location'}")
        
        # Test serializer
        serializer = SavedJobSerializer(saved_job)
        data = serializer.data
        print(f"  Serialized job title: {data.get('job', {}).get('title', 'Not found')}")
        print(f"  Serialized company name: {data.get('job', {}).get('company', {}).get('name', 'Not found')}")
        print()

if __name__ == "__main__":
    test_dashboard_data() 