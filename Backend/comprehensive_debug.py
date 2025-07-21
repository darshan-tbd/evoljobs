import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.jobs.models import JobPosting
from django.utils import timezone
from django.test import Client
from django.db.models import Q

def check_all_jobs():
    print("=== ALL JOBS IN DATABASE ===")
    jobs = JobPosting.objects.all()
    print(f"Total jobs: {jobs.count()}")
    
    for i, job in enumerate(jobs):
        print(f"{i+1}. {job.title}")
        print(f"   Status: {job.status}")
        print(f"   Deleted: {job.is_deleted}")
        print(f"   Deadline: {job.application_deadline}")
        if job.application_deadline:
            expired = job.application_deadline <= timezone.now()
            print(f"   Expired: {expired}")
        print()

def check_filtered_jobs():
    print("=== FILTERED JOBS (like API) ===")
    # Same filter as the viewset
    queryset = JobPosting.objects.filter(status='active', is_deleted=False)
    print(f"Active, non-deleted jobs: {queryset.count()}")
    
    # Apply exclude_expired filter
    now = timezone.now()
    filtered_queryset = queryset.filter(
        Q(application_deadline__isnull=True) |
        Q(application_deadline__gt=now)
    )
    print(f"After exclude_expired filter: {filtered_queryset.count()}")
    
    for i, job in enumerate(filtered_queryset):
        print(f"{i+1}. {job.title}")

def test_api():
    print("=== API TEST ===")
    client = Client()
    
    # Test without exclude_expired
    response = client.get('/api/v1/jobs/jobs/')
    print(f"Without exclude_expired - Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Count: {data.get('count', 'N/A')}")
        print(f"Results: {len(data.get('results', []))}")
    
    # Test with exclude_expired=true (frontend default)
    response = client.get('/api/v1/jobs/jobs/?exclude_expired=true')
    print(f"With exclude_expired=true - Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Count: {data.get('count', 'N/A')}")
        print(f"Results: {len(data.get('results', []))}")
        for i, job in enumerate(data.get('results', [])):
            print(f"  {i+1}. {job['title']}")

if __name__ == "__main__":
    check_all_jobs()
    check_filtered_jobs()
    test_api() 