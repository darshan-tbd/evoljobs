import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.core.models import Location

User = get_user_model()

def create_test_user():
    """Create a test user for login testing"""
    try:
        # Check if test user already exists
        test_user = User.objects.filter(email='test@evoljobs.com').first()
        if test_user:
            print(f"✅ Test user already exists: {test_user.email}")
            return test_user
        
        # Create test user
        user = User.objects.create_user(
            email='test@evoljobs.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            user_type='job_seeker'
        )
        print(f"✅ Created test user: {user.email}")
        return user
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return None

def check_database():
    """Check database status"""
    try:
        user_count = User.objects.count()
        job_count = JobPosting.objects.count()
        company_count = Company.objects.count()
        location_count = Location.objects.count()
        
        print(f"📊 Database Status:")
        print(f"   Users: {user_count}")
        print(f"   Jobs: {job_count}")
        print(f"   Companies: {company_count}")
        print(f"   Locations: {location_count}")
        
        return job_count
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return 0

def run_scraper():
    """Run the job scraper"""
    try:
        print("🔍 Running job scraper...")
        from fetch_michael_page_job import fetch_michael_page_job
        fetch_michael_page_job()
        print("✅ Scraper completed")
    except Exception as e:
        print(f"❌ Error running scraper: {e}")

if __name__ == "__main__":
    print("🚀 Setting up EvolJobs test environment...")
    
    # Check database
    initial_jobs = check_database()
    
    # Create test user
    create_test_user()
    
    # Run scraper if no jobs exist
    if initial_jobs == 0:
        run_scraper()
    else:
        print(f"✅ Database already has {initial_jobs} jobs")
    
    # Final database check
    check_database()
    
    print("\n🎉 Setup complete!")
    print("📝 Test credentials:")
    print("   Email: test@evoljobs.com")
    print("   Password: testpass123")
    print("\n🌐 Frontend URL: http://localhost:3000")
    print("🔧 Backend URL: http://127.0.0.1:8000") 