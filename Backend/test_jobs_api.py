#!/usr/bin/env python
import os
import sys
import django
import requests
import json

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

def test_jobs_endpoint():
    """Test the jobs endpoint to see if jobs are available"""
    url = "http://127.0.0.1:8000/api/v1/jobs/"
    
    try:
        print(f"🔍 Testing jobs endpoint: {url}")
        
        response = requests.get(url)
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ Jobs API working!")
            try:
                jobs_data = response.json()
                print(f"📊 Found {jobs_data.get('count', 0)} jobs")
                if jobs_data.get('results'):
                    print("📋 Sample jobs:")
                    for i, job in enumerate(jobs_data['results'][:3]):
                        print(f"   {i+1}. {job.get('title', 'No title')} at {job.get('company', {}).get('name', 'Unknown company')}")
                else:
                    print("📝 No jobs found - you may need to run the scraper")
            except:
                print(f"Raw response: {response.text}")
        else:
            print(f"❌ Jobs API error - Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server is not running")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_jobs_api()
    test_jobs_endpoint() 