#!/usr/bin/env python
"""
Debug script to check dashboard data issue
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.applications.models import JobApplication
from apps.jobs.models import SavedJob, JobPosting
from apps.users.models import User
from apps.applications.serializers import JobApplicationSerializer
from apps.jobs.serializers import SavedJobSerializer
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

def debug_dashboard_issue():
    print("=== Debug Dashboard Issue ===")
    
    # Get a user
    user = User.objects.first()
    if not user:
        print("No users found!")
        return
    
    print(f"Testing with user: {user.email}")
    
    # Create API client
    client = APIClient()
    
    # Test applications endpoint
    print("\n--- Testing Applications API Endpoint ---")
    applications = JobApplication.objects.filter(applicant=user)
    print(f"Total applications in DB: {applications.count()}")
    
    for app in applications:
        print(f"Application ID: {app.id}")
        print(f"  Job: {app.job.title if app.job else 'No job'}")
        print(f"  Company: {app.job.company.name if app.job and app.job.company else 'No company'}")
        print(f"  Status: {app.status}")
        print(f"  Applied: {app.applied_at}")
        
        # Test serializer
        serializer = JobApplicationSerializer(app)
        data = serializer.data
        print(f"  Serialized data keys: {list(data.keys())}")
        print(f"  job_title: {data.get('job_title')}")
        print(f"  job_company_name: {data.get('job_company_name')}")
        print(f"  status: {data.get('status')}")
        print()
    
    # Test saved jobs
    print("\n--- Testing Saved Jobs ---")
    saved_jobs = SavedJob.objects.filter(user=user)
    print(f"Total saved jobs in DB: {saved_jobs.count()}")
    
    for saved_job in saved_jobs:
        print(f"Saved Job ID: {saved_job.id}")
        print(f"  Job: {saved_job.job.title if saved_job.job else 'No job'}")
        print(f"  Company: {saved_job.job.company.name if saved_job.job and saved_job.job.company else 'No company'}")
        
        # Test serializer
        serializer = SavedJobSerializer(saved_job)
        data = serializer.data
        print(f"  Serialized data: {data}")
        print()
    
    # Check if there are any jobs in the system
    print("\n--- Checking Jobs in System ---")
    total_jobs = JobPosting.objects.count()
    print(f"Total jobs in system: {total_jobs}")
    
    if total_jobs > 0:
        sample_job = JobPosting.objects.first()
        print(f"Sample job: {sample_job.title} at {sample_job.company.name}")
    
    # Check if there are any companies
    print("\n--- Checking Companies ---")
    from apps.companies.models import Company
    total_companies = Company.objects.count()
    print(f"Total companies: {total_companies}")
    
    if total_companies > 0:
        sample_company = Company.objects.first()
        print(f"Sample company: {sample_company.name}")

if __name__ == "__main__":
    debug_dashboard_issue() 