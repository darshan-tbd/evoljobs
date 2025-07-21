import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.jobs.models import JobPosting
from apps.jobs.serializers import JobPostingListSerializer
from django.test import Client
import json

def test_individual_serialization():
    """Test serialization of each job individually"""
    print("=== INDIVIDUAL JOB SERIALIZATION TEST ===")
    
    jobs = JobPosting.objects.filter(status='active', is_deleted=False).order_by('-created_at')
    print(f"Found {jobs.count()} jobs")
    
    for i, job in enumerate(jobs):
        print(f"\n{i+1}. Testing job: {job.title}")
        try:
            serializer = JobPostingListSerializer(job)
            data = serializer.data
            print(f"   ✅ Serialization successful")
            print(f"   ID: {data.get('id', 'Missing')}")
            print(f"   Title: {data.get('title', 'Missing')}")
            
            # Check for any missing required fields
            required_fields = ['id', 'title', 'company', 'created_at']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
                
        except Exception as e:
            print(f"   ❌ Serialization failed: {str(e)}")
            print(f"   Job details: Status={job.status}, Deleted={job.is_deleted}")
            if hasattr(job, 'company') and job.company:
                print(f"   Company: {job.company.name}")
            else:
                print(f"   ❌ No company associated!")

def test_api_response_details():
    """Test the actual API response in detail"""
    print("\n=== API RESPONSE DETAILS ===")
    
    client = Client()
    response = client.get('/api/v1/jobs/jobs/?exclude_expired=true&ordering=-created_at&page=1')
    
    if response.status_code == 200:
        data = response.json()
        print(f"API returned {len(data['results'])} jobs out of {data['count']} total")
        
        for i, job_data in enumerate(data['results']):
            print(f"{i+1}. {job_data.get('title', 'NO TITLE')} (ID: {job_data.get('id', 'NO ID')})")
        
        # Compare with direct database query
        db_jobs = list(JobPosting.objects.filter(status='active', is_deleted=False).order_by('-created_at').values('id', 'title'))
        print(f"\nDirect DB query returned {len(db_jobs)} jobs:")
        for i, job in enumerate(db_jobs):
            print(f"{i+1}. {job['title']} (ID: {job['id']})")
            
        # Find discrepancies
        api_ids = {job['id'] for job in data['results']}
        db_ids = {str(job['id']) for job in db_jobs}
        
        missing_from_api = db_ids - api_ids
        if missing_from_api:
            print(f"\n❌ Jobs missing from API response: {missing_from_api}")
            # Get details of missing jobs
            for job_id in missing_from_api:
                missing_job = JobPosting.objects.get(id=job_id)
                print(f"   Missing job: {missing_job.title}")
                print(f"   Company: {missing_job.company.name if missing_job.company else 'NO COMPANY'}")
                print(f"   Location: {missing_job.location.name if missing_job.location else 'NO LOCATION'}")
        else:
            print("✅ All database jobs are present in API response")
            
    else:
        print(f"API Error: {response.status_code}")

if __name__ == "__main__":
    test_individual_serialization()
    test_api_response_details() 