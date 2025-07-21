#!/usr/bin/env python
"""
Manual AI Features Test Script
Tests each AI feature individually to verify functionality
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.jobs.models import JobPosting
from apps.ai.services import JobMatchingEngine, SummaryGenerationService
from apps.ai.models import *

User = get_user_model()

def test_user_embeddings():
    """Test user embedding generation"""
    print("🧪 Testing User Embeddings...")
    
    user = User.objects.filter(email='demo@example.com').first()
    if not user:
        print("❌ Demo user not found")
        return False
    
    engine = JobMatchingEngine()
    try:
        embedding = engine.generate_user_embedding(user)
        print(f"✅ User embedding generated: {embedding.id}")
        print(f"✅ Embedding dimension: {len(embedding.embedding_vector)}")
        print(f"✅ Model version: {embedding.model_version}")
        return True
    except Exception as e:
        print(f"❌ Error generating user embedding: {e}")
        return False

def test_job_embeddings():
    """Test job embedding generation"""
    print("\n🧪 Testing Job Embeddings...")
    
    jobs = JobPosting.objects.filter(status='active')[:2]
    if not jobs:
        print("❌ No active jobs found")
        return False
    
    engine = JobMatchingEngine()
    success_count = 0
    
    for job in jobs:
        try:
            embedding = engine.generate_job_embedding(job)
            print(f"✅ Job embedding for '{job.title}': {embedding.id}")
            success_count += 1
        except Exception as e:
            print(f"❌ Error generating embedding for '{job.title}': {e}")
    
    print(f"✅ Generated {success_count}/{len(jobs)} job embeddings")
    return success_count > 0

def test_job_matching():
    """Test job matching algorithm"""
    print("\n🧪 Testing Job Matching...")
    
    user = User.objects.filter(email='demo@example.com').first()
    if not user:
        print("❌ Demo user not found")
        return False
    
    engine = JobMatchingEngine()
    try:
        matches = engine.compute_job_matches(user, limit=3)
        print(f"✅ Computed {len(matches)} job matches")
        
        for match in matches:
            print(f"   🎯 {match.job.title}: {match.overall_score:.3f}")
            print(f"      Skills: {match.skills_match_score:.3f}")
            print(f"      Experience: {match.experience_match_score:.3f}")
            print(f"      Location: {match.location_match_score:.3f}")
        
        return len(matches) > 0
    except Exception as e:
        print(f"❌ Error computing job matches: {e}")
        return False

def test_job_summaries():
    """Test job summary generation"""
    print("\n🧪 Testing Job Summaries...")
    
    jobs = JobPosting.objects.filter(status='active')[:2]
    if not jobs:
        print("❌ No active jobs found")
        return False
    
    service = SummaryGenerationService()
    success_count = 0
    
    for job in jobs:
        try:
            summary_data = service.generate_job_summary(job)
            print(f"✅ Summary for '{job.title}':")
            print(f"   📄 Brief: {summary_data['brief_summary'][:100]}...")
            print(f"   🏷️  Category: {summary_data['job_category']}")
            print(f"   📊 Seniority: {summary_data['seniority_level']}")
            print(f"   🔧 Skills: {summary_data['extracted_skills']}")
            print(f"   📈 Confidence: {summary_data['confidence_score']:.3f}")
            success_count += 1
        except Exception as e:
            print(f"❌ Error generating summary for '{job.title}': {e}")
    
    print(f"✅ Generated {success_count}/{len(jobs)} summaries")
    return success_count > 0

def test_recommendations():
    """Test personalized recommendations"""
    print("\n🧪 Testing Personalized Recommendations...")
    
    user = User.objects.filter(email='demo@example.com').first()
    if not user:
        print("❌ Demo user not found")
        return False
    
    engine = JobMatchingEngine()
    try:
        recommendations = engine.get_job_recommendations(user, limit=3)
        print(f"✅ Generated {len(recommendations)} recommendations")
        
        for rec in recommendations:
            print(f"   📋 {rec['title']} at {rec['company']}")
            print(f"      Match Score: {rec['match_score']:.3f}")
            print(f"      Highlights: {rec['key_highlights'][:2]}")
        
        return len(recommendations) > 0
    except Exception as e:
        print(f"❌ Error generating recommendations: {e}")
        return False

def test_user_interactions():
    """Test user interaction logging"""
    print("\n🧪 Testing User Interaction Logging...")
    
    user = User.objects.filter(email='demo@example.com').first()
    job = JobPosting.objects.filter(status='active').first()
    
    if not user or not job:
        print("❌ Demo user or job not found")
        return False
    
    try:
        # Create test interaction
        interaction = UserInteractionLog.objects.create(
            user=user,
            job=job,
            interaction_type='job_view',
            interaction_data={'source': 'test', 'timestamp': '2024-01-01T10:00:00Z'},
            session_id='test_session'
        )
        
        print(f"✅ Interaction logged: {interaction.id}")
        print(f"   Type: {interaction.interaction_type}")
        print(f"   Job: {interaction.job.title}")
        print(f"   Data: {interaction.interaction_data}")
        
        return True
    except Exception as e:
        print(f"❌ Error logging interaction: {e}")
        return False

def test_database_queries():
    """Test database query performance"""
    print("\n🧪 Testing Database Queries...")
    
    try:
        # Test model counts
        counts = {
            'Users': User.objects.count(),
            'Job Postings': JobPosting.objects.count(),
            'User Embeddings': UserEmbedding.objects.count(),
            'Job Embeddings': JobEmbedding.objects.count(),
            'Job Matches': JobMatchScore.objects.count(),
            'Job Summaries': JobSummary.objects.count(),
            'Interactions': UserInteractionLog.objects.count(),
        }
        
        print("✅ Database Model Counts:")
        for model, count in counts.items():
            print(f"   {model}: {count}")
        
        return all(count >= 0 for count in counts.values())
    except Exception as e:
        print(f"❌ Error querying database: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Phase 2 AI Manual Testing Suite")
    print("=" * 50)
    
    tests = [
        test_database_queries,
        test_user_embeddings,
        test_job_embeddings,
        test_job_matching,
        test_job_summaries,
        test_recommendations,
        test_user_interactions,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print(f"\n🎯 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Phase 2 AI is working correctly.")
    else:
        print(f"⚠️  {total - passed} tests failed. Please check the issues above.")
    
    return passed == total

if __name__ == "__main__":
    main() 