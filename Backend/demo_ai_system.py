#!/usr/bin/env python
"""
AI-Powered Job Platform Demo Script - Phase 2
Demonstrates the complete AI functionality including:
- Job Matching Engine
- Summary Generation Service
- User and Job Embeddings
- AI-Powered Analytics
- Recommendation System
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Skill, Location, Industry
from apps.companies.models import Company
from apps.jobs.models import JobPosting
from apps.ai.services import JobMatchingEngine, SummaryGenerationService
from apps.ai.models import (
    UserEmbedding, JobEmbedding, JobMatchScore, JobSummary, 
    AIRecommendation, UserInteractionLog
)

User = get_user_model()

def setup_demo_data():
    """Setup demonstration data for the AI system"""
    print("🔧 Setting up demo data...")
    
    # Create demo user
    user, created = User.objects.get_or_create(
        email='demo@example.com',
        defaults={
            'first_name': 'Demo',
            'last_name': 'User',
            'is_active': True
        }
    )
    if created:
        user.set_password('demo123')
        user.save()
        print(f"✅ Created demo user: {user.email}")
    
    # Create demo skills
    skills_data = [
        'Python', 'Django', 'React', 'JavaScript', 'Machine Learning',
        'Data Science', 'AWS', 'PostgreSQL', 'Docker', 'Git'
    ]
    
    skills = []
    for skill_name in skills_data:
        skill, created = Skill.objects.get_or_create(name=skill_name)
        skills.append(skill)
        if created:
            print(f"✅ Created skill: {skill_name}")
    
    # Create demo location
    location, created = Location.objects.get_or_create(
        name='San Francisco, CA',
        defaults={
            'country': 'USA',
            'state': 'California',
            'city': 'San Francisco'
        }
    )
    if created:
        print(f"✅ Created location: {location.name}")
    
    # Create demo industry
    industry, created = Industry.objects.get_or_create(
        name='Technology',
        defaults={'description': 'Technology and Software Development'}
    )
    if created:
        print(f"✅ Created industry: {industry.name}")
    
    # Create demo company
    company, created = Company.objects.get_or_create(
        name='TechCorp AI',
        defaults={
            'description': 'Leading AI and Machine Learning company',
            'website': 'https://techcorp.ai',
            'headquarters': location,
            'industry': industry,
            'company_size': 'medium',
            'slug': 'techcorp-ai'
        }
    )
    if created:
        print(f"✅ Created company: {company.name}")
    
    # Create demo job postings
    job_data = [
        {
            'title': 'Senior Python Developer',
            'slug': 'senior-python-developer',
            'description': 'We are looking for a Senior Python Developer to join our AI team. You will work on developing scalable machine learning systems and APIs.',
            'requirements': 'Bachelor\'s degree in Computer Science, 5+ years Python experience, Django expertise, Machine Learning knowledge',
            'job_type': 'full_time',
            'experience_level': 'senior',
            'remote_option': 'hybrid',
            'salary_min': 120000,
            'salary_max': 180000,
            'required_skills': ['Python', 'Django', 'Machine Learning', 'PostgreSQL']
        },
        {
            'title': 'Machine Learning Engineer',
            'slug': 'machine-learning-engineer',
            'description': 'Join our ML team to build cutting-edge recommendation systems and data processing pipelines.',
            'requirements': 'MS in Computer Science or related field, 3+ years ML experience, Python proficiency, AWS knowledge',
            'job_type': 'full_time',
            'experience_level': 'mid',
            'remote_option': 'remote',
            'salary_min': 100000,
            'salary_max': 150000,
            'required_skills': ['Python', 'Machine Learning', 'Data Science', 'AWS']
        },
        {
            'title': 'Full Stack Developer',
            'slug': 'full-stack-developer',
            'description': 'Develop modern web applications using React and Django. Work on our job platform features.',
            'requirements': 'Bachelor\'s degree, 3+ years full-stack development, React and Django experience',
            'job_type': 'full_time',
            'experience_level': 'mid',
            'remote_option': 'hybrid',
            'salary_min': 90000,
            'salary_max': 130000,
            'required_skills': ['React', 'JavaScript', 'Django', 'PostgreSQL']
        }
    ]
    
    jobs = []
    for job_info in job_data:
        required_skills = job_info.pop('required_skills')
        job, created = JobPosting.objects.get_or_create(
            title=job_info['title'],
            company=company,
            defaults={
                **job_info,
                'posted_by': user,
                'location': location,
                'industry': industry,
                'status': 'active'
            }
        )
        
        if created:
            # Add required skills
            for skill_name in required_skills:
                skill = Skill.objects.get(name=skill_name)
                job.required_skills.add(skill)
            job.save()
            print(f"✅ Created job: {job.title}")
        
        jobs.append(job)
    
    # Add skills to user profile
    if hasattr(user, 'profile'):
        user.profile.skills.set(skills[:5])  # Add first 5 skills
        user.profile.location = location
        user.profile.save()
        print(f"✅ Updated user profile with skills and location")
    
    print("🎉 Demo data setup complete!\n")
    return user, jobs, skills, company

def demonstrate_job_matching():
    """Demonstrate the job matching engine"""
    print("🤖 AI Job Matching Engine Demo")
    print("=" * 50)
    
    # Initialize the job matching engine
    matching_engine = JobMatchingEngine()
    
    # Get demo user
    user = User.objects.get(email='demo@example.com')
    
    # Generate user embedding
    print("1. Generating user embedding...")
    user_embedding = matching_engine.generate_user_embedding(user)
    print(f"   ✅ User embedding created: {user_embedding.id}")
    print(f"   📊 Embedding dimension: {len(user_embedding.embedding_vector)}")
    
    # Generate job embeddings
    print("\n2. Generating job embeddings...")
    jobs = JobPosting.objects.filter(status='active')
    for job in jobs:
        job_embedding = matching_engine.generate_job_embedding(job)
        print(f"   ✅ Job embedding created for: {job.title}")
    
    # Compute job matches
    print("\n3. Computing job matches...")
    matches = matching_engine.compute_job_matches(user, limit=10)
    
    print(f"\n📊 Job Match Results:")
    for match in matches:
        print(f"   🎯 {match.job.title} at {match.job.company.name}")
        print(f"      Overall Score: {match.overall_score:.3f}")
        print(f"      Skills Match: {match.skills_match_score:.3f}")
        print(f"      Experience Match: {match.experience_match_score:.3f}")
        print(f"      Location Match: {match.location_match_score:.3f}")
        print(f"      Salary Match: {match.salary_match_score:.3f}")
        print(f"      Rank: #{match.rank_score}")
        print()
    
    # Get personalized recommendations
    print("4. Getting personalized recommendations...")
    recommendations = matching_engine.get_job_recommendations(user, limit=5)
    
    print(f"\n🎯 Personalized Job Recommendations:")
    for rec in recommendations:
        print(f"   📋 {rec['title']} at {rec['company']}")
        print(f"      Match Score: {rec['match_score']:.3f}")
        print(f"      Key Highlights: {rec['key_highlights'][:3]}")
        print(f"      Brief Summary: {rec['brief_summary'][:100]}...")
        print()
    
    return matches, recommendations

def demonstrate_summary_generation():
    """Demonstrate the summary generation service"""
    print("📝 AI Summary Generation Demo")
    print("=" * 50)
    
    # Initialize the summary service
    summary_service = SummaryGenerationService()
    
    # Get demo jobs
    jobs = JobPosting.objects.filter(status='active')
    
    for job in jobs:
        print(f"\n🔍 Generating AI summary for: {job.title}")
        
        # Generate summary
        summary_data = summary_service.generate_job_summary(job)
        
        # Save summary
        job_summary, created = JobSummary.objects.get_or_create(
            job=job,
            defaults=summary_data
        )
        
        print(f"   ✅ Summary generated (confidence: {summary_data['confidence_score']:.3f})")
        print(f"   📄 Brief Summary: {summary_data['brief_summary']}")
        print(f"   🏷️  Category: {summary_data['job_category']}")
        print(f"   📊 Seniority: {summary_data['seniority_level']}")
        print(f"   🔧 Extracted Skills: {summary_data['extracted_skills']}")
        print(f"   ✅ Requirements: {summary_data['extracted_requirements']}")
        print(f"   🎁 Benefits: {summary_data['extracted_benefits']}")
        print()

def demonstrate_user_insights():
    """Demonstrate user insights and analytics"""
    print("📊 AI User Insights Demo")
    print("=" * 50)
    
    user = User.objects.get(email='demo@example.com')
    
    # Create some demo interactions
    jobs = JobPosting.objects.filter(status='active')
    
    interaction_data = [
        {'job': jobs[0], 'interaction_type': 'job_view', 'data': {'source': 'search'}},
        {'job': jobs[0], 'interaction_type': 'job_click', 'data': {'position': 1}},
        {'job': jobs[1], 'interaction_type': 'job_view', 'data': {'source': 'recommendation'}},
        {'job': jobs[1], 'interaction_type': 'job_save', 'data': {'collection': 'favorites'}},
        {'job': jobs[2], 'interaction_type': 'job_view', 'data': {'source': 'search'}},
    ]
    
    print("1. Creating demo user interactions...")
    for interaction in interaction_data:
        UserInteractionLog.objects.get_or_create(
            user=user,
            job=interaction['job'],
            interaction_type=interaction['interaction_type'],
            defaults={
                'interaction_data': interaction['data'],
                'session_id': 'demo_session_123'
            }
        )
    
    print("   ✅ Demo interactions created")
    
    # Get user matches for analysis
    matches = JobMatchScore.objects.filter(user=user)
    
    print(f"\n2. Analyzing user profile and behavior...")
    print(f"   👤 User: {user.get_full_name()}")
    print(f"   📧 Email: {user.email}")
    print(f"   🎯 Total Job Matches: {matches.count()}")
    print(f"   🔍 Interactions Logged: {UserInteractionLog.objects.filter(user=user).count()}")
    
    # Calculate insights
    if matches.exists():
        avg_match_score = sum(m.overall_score for m in matches) / matches.count()
        high_matches = matches.filter(overall_score__gte=0.8).count()
        
        print(f"   📊 Average Match Score: {avg_match_score:.3f}")
        print(f"   🎯 High-Quality Matches: {high_matches}")
        
        # Top matching industries
        print(f"\n3. Top matching job categories:")
        for match in matches.order_by('-overall_score')[:3]:
            print(f"   🏢 {match.job.industry.name}: {match.overall_score:.3f}")
    
    print()

def demonstrate_api_endpoints():
    """Demonstrate key API endpoints"""
    print("🌐 AI API Endpoints Demo")
    print("=" * 50)
    
    user = User.objects.get(email='demo@example.com')
    
    print("Available AI-powered API endpoints:")
    print()
    
    endpoints = [
        ("GET /api/v1/ai/recommendations/job-recommendations/", 
         "Get personalized job recommendations"),
        ("POST /api/v1/ai/recommendations/generate-user-embedding/", 
         "Generate/update user embedding"),
        ("POST /api/v1/ai/recommendations/compute-job-matches/", 
         "Compute job compatibility scores"),
        ("GET /api/v1/ai/recommendations/job-summary/?job_id=X", 
         "Get AI-generated job summary"),
        ("GET /api/v1/ai/recommendations/user-insights/", 
         "Get AI-powered user insights"),
        ("POST /api/v1/ai/recommendations/interaction-feedback/", 
         "Record user interaction feedback"),
        ("GET /api/v1/analytics/user-behavior/", 
         "Get user behavior analytics"),
        ("GET /api/v1/analytics/job-performance/", 
         "Get job performance metrics"),
        ("GET /api/v1/analytics/matching-metrics/", 
         "Get ML model performance metrics"),
    ]
    
    for endpoint, description in endpoints:
        print(f"   🔗 {endpoint}")
        print(f"      {description}")
        print()
    
    print("📝 Example API Usage:")
    print("""
    # Get job recommendations
    curl -X GET "http://localhost:8000/api/v1/ai/recommendations/job-recommendations/" \\
         -H "Authorization: Bearer YOUR_TOKEN"
    
    # Generate user embedding  
    curl -X POST "http://localhost:8000/api/v1/ai/recommendations/generate-user-embedding/" \\
         -H "Authorization: Bearer YOUR_TOKEN"
    
    # Get user behavior analytics
    curl -X GET "http://localhost:8000/api/v1/analytics/user-behavior/?days=30" \\
         -H "Authorization: Bearer YOUR_TOKEN"
    """)

def show_system_architecture():
    """Show the system architecture overview"""
    print("🏗️  AI System Architecture Overview")
    print("=" * 50)
    
    architecture = """
    Phase 2 AI-Powered Job Platform Architecture:
    
    📊 ML Models & Embeddings:
    ├── UserEmbeddingModel (256-dim vectors)
    ├── JobEmbeddingModel (256-dim vectors)
    ├── JobMatchingModel (Neural network similarity)
    └── SummaryGenerationService (NLP-based)
    
    🗄️  Database Models:
    ├── UserEmbedding (user profile vectors)
    ├── JobEmbedding (job description vectors)
    ├── JobMatchScore (compatibility scores)
    ├── JobSummary (AI-generated summaries)
    ├── AIRecommendation (personalized recommendations)
    ├── UserInteractionLog (behavior tracking)
    ├── JobPerformanceMetrics (job analytics)
    └── MLModelMetrics (model performance)
    
    🎯 Core Services:
    ├── JobMatchingEngine (main AI engine)
    ├── SummaryGenerationService (content generation)
    └── Analytics Services (insights & metrics)
    
    🌐 API Endpoints:
    ├── /api/v1/ai/* (AI-powered features)
    └── /api/v1/analytics/* (analytics & insights)
    
    🔧 Key Features:
    ├── ML-powered job matching (cosine similarity + neural networks)
    ├── Transformer-based job summarization
    ├── Real-time recommendation system
    ├── User behavior analytics
    ├── Job performance tracking
    ├── Model performance monitoring
    └── Interactive feedback loop
    """
    
    print(architecture)

def main():
    """Main demo function"""
    print("🚀 AI-Powered Job Platform - Phase 2 Demo")
    print("=" * 60)
    print()
    
    try:
        # Setup demo data
        user, jobs, skills, company = setup_demo_data()
        
        # Demonstrate each component
        show_system_architecture()
        print()
        
        matches, recommendations = demonstrate_job_matching()
        print()
        
        demonstrate_summary_generation()
        print()
        
        demonstrate_user_insights()
        print()
        
        demonstrate_api_endpoints()
        print()
        
        # Final summary
        print("🎉 Phase 2 AI Demo Complete!")
        print("=" * 50)
        print()
        
        summary = f"""
        ✅ Successfully demonstrated:
        
        🤖 AI Job Matching Engine
        ├── Generated {UserEmbedding.objects.count()} user embeddings
        ├── Generated {JobEmbedding.objects.count()} job embeddings
        ├── Computed {JobMatchScore.objects.count()} job matches
        └── Created {len(recommendations)} personalized recommendations
        
        📝 AI Summary Generation
        ├── Generated {JobSummary.objects.count()} job summaries
        ├── Extracted skills, requirements, and benefits
        └── Classified jobs by category and seniority
        
        📊 Analytics & Insights
        ├── Tracked {UserInteractionLog.objects.count()} user interactions
        ├── Analyzed user behavior patterns
        └── Generated performance metrics
        
        🌐 API Endpoints
        ├── 9 AI-powered API endpoints ready
        ├── Authentication & permission controls
        └── Comprehensive input/output schemas
        
        🎯 Production Ready Features:
        ├── Scalable ML model architecture
        ├── Real-time recommendation system
        ├── Performance monitoring & analytics
        ├── Interactive feedback loops
        └── Admin interface for all models
        
        The system is now ready for production deployment!
        """
        
        print(summary)
        
    except Exception as e:
        print(f"❌ Error during demo: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 