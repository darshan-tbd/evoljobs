#!/usr/bin/env python
"""
Simple test script to check job recommendations functionality
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.ai.services import job_matching_service
from apps.jobs.models import JobPosting
from apps.users.models import UserProfile

User = get_user_model()

def test_recommendations():
    print("=== Testing Job Recommendations ===")
    
    # Check basic data
    users_count = User.objects.count()
    jobs_count = JobPosting.objects.filter(status='active').count()
    
    print(f"Users in database: {users_count}")
    print(f"Active jobs in database: {jobs_count}")
    
    if users_count == 0:
        print("❌ No users found - recommendations need users")
        return
        
    if jobs_count == 0:
        print("❌ No active jobs found - recommendations need jobs")
        return
    
    # Get the specific user (admin1@gmail.com)
    try:
        user = User.objects.get(email='admin1@gmail.com')
        print(f"Testing with user: {user.email}")
    except User.DoesNotExist:
        print("❌ admin1@gmail.com user not found")
        return
    
    # Check if user has profile
    try:
        profile = UserProfile.objects.get(user=user)
        print(f"User profile found:")
        print(f"  - Skills: '{profile.skills_text}'")
        print(f"  - Experience: {profile.experience_level}")
        print(f"  - Location: {profile.location_text if hasattr(profile, 'location_text') else 'N/A'}")
    except UserProfile.DoesNotExist:
        print("⚠️ User has no profile - this might affect recommendations")
    
    # Test individual job scores
    print("\n=== Testing Individual Job Scores ===")
    sample_jobs = JobPosting.objects.filter(status='active')[:5]
    
    for job in sample_jobs:
        try:
            score, breakdown = job_matching_service.calculate_match_score(user, job)
            print(f"Job: {job.title[:50]}")
            print(f"  Score: {score:.1f}")
            print(f"  Breakdown: {breakdown}")
            print(f"  Above threshold (30): {'✅' if score > 30 else '❌'}")
            print()
        except Exception as e:
            print(f"  Error calculating score: {e}")
    
    # Test the job matching service
    try:
        print("=== Testing Recommendation Service ===")
        recommended = job_matching_service.get_recommended_jobs(user, 5)
        
        if recommended:
            print(f"✅ Found {len(recommended)} recommendations")
            for i, rec in enumerate(recommended[:3]):
                print(f"  {i+1}. {rec['job'].title} - Score: {rec['match_score']:.1f}")
        else:
            print("❌ No recommendations returned (all scores below 30 threshold)")
            
    except Exception as e:
        print(f"❌ Error in job matching service: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_recommendations() 