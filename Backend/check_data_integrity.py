import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.jobs.models import JobPosting
from apps.jobs.serializers import JobPostingListSerializer

def check_data_integrity():
    """Check for data integrity issues that could cause frontend rendering problems"""
    
    print("=== DATA INTEGRITY CHECK ===")
    
    jobs = JobPosting.objects.filter(status='active', is_deleted=False).order_by('-created_at')
    print(f"Found {jobs.count()} active jobs")
    
    issues_found = []
    
    for i, job in enumerate(jobs):
        print(f"\n{i+1}. Checking job: {job.title}")
        job_issues = []
        
        # Check required fields
        if not job.title:
            job_issues.append("Missing title")
        if not job.company:
            job_issues.append("Missing company")
        if not job.company_id:
            job_issues.append("Missing company_id")
        
        # Check company data
        if job.company:
            if not job.company.name:
                job_issues.append("Company missing name")
        else:
            job_issues.append("No company object")
        
        # Test serialization
        try:
            serializer = JobPostingListSerializer(job)
            data = serializer.data
            
            # Check serialized data
            if not data.get('id'):
                job_issues.append("Serialized data missing ID")
            if not data.get('title'):
                job_issues.append("Serialized data missing title")
            if not data.get('company'):
                job_issues.append("Serialized data missing company")
            elif not data['company'].get('name'):
                job_issues.append("Serialized company missing name")
                
        except Exception as e:
            job_issues.append(f"Serialization error: {str(e)}")
        
        if job_issues:
            issues_found.extend(job_issues)
            print(f"   ❌ Issues found: {', '.join(job_issues)}")
        else:
            print(f"   ✅ No issues found")
    
    print(f"\n=== SUMMARY ===")
    if issues_found:
        print(f"❌ Found {len(issues_found)} issues total:")
        for issue in set(issues_found):  # Remove duplicates
            print(f"   - {issue}")
    else:
        print("✅ No data integrity issues found")
    
    return len(issues_found) == 0

if __name__ == "__main__":
    check_data_integrity() 