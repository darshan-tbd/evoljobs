#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
sys.path.append('/c%3A/All-Projects/evoljobs.com/Backend')
django.setup()

from django.test import Client
from apps.jobs.models import JobPosting

def test_jobs_api():
    print("=== Database Check ===")
    all_jobs = JobPosting.objects.all()
    print(f"Total jobs in database: {all_jobs.count()}")
    for i, job in enumerate(all_jobs):
        print(f"{i+1}. {job.title} | Status: {job.status} | Deleted: {job.is_deleted}")
    
    print("\n=== API Response Check ===")
    client = Client()
    response = client.get('/api/v1/jobs/jobs/')
    print(f"API Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        print(f"Total count from API: {data.get('count', 'N/A')}")
        print(f"Results length: {len(data.get('results', []))}")
        
        print("\nJobs returned by API:")
        for i, job in enumerate(data.get('results', [])):
            print(f"{i+1}. {job['title']}")
    else:
        print(f"API Error: {response.content}")

if __name__ == "__main__":
    test_jobs_api() 