#!/usr/bin/env python
"""
Create test users for admin dashboard testing
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import UserProfile, UserExperience, UserEducation

User = get_user_model()

def create_test_users():
    """Create test users for admin dashboard"""
    
    print("🧪 Creating Test Users for Admin Dashboard")
    print("=" * 50)
    
    # Clean up any existing test users
    print("1️⃣ Cleaning up existing test users...")
    User.objects.filter(email__startswith='test_').delete()
    print("✅ Cleanup completed")
    
    # Create test users
    test_users = [
        {
            'email': 'test_jobseeker1@example.com',
            'password': 'testpass123',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_type': 'job_seeker',
            'is_active': True,
            'is_verified': True,
        },
        {
            'email': 'test_jobseeker2@example.com',
            'password': 'testpass123',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'user_type': 'job_seeker',
            'is_active': True,
            'is_verified': False,
        },
        {
            'email': 'test_employer1@example.com',
            'password': 'testpass123',
            'first_name': 'Bob',
            'last_name': 'Johnson',
            'user_type': 'employer',
            'is_active': True,
            'is_verified': True,
        },
        {
            'email': 'test_employer2@example.com',
            'password': 'testpass123',
            'first_name': 'Alice',
            'last_name': 'Brown',
            'user_type': 'employer',
            'is_active': False,
            'is_verified': False,
        },
        {
            'email': 'test_admin2@example.com',
            'password': 'testpass123',
            'first_name': 'Admin',
            'last_name': 'User',
            'user_type': 'admin',
            'is_active': True,
            'is_verified': True,
        },
    ]
    
    created_users = []
    
    for user_data in test_users:
        try:
            user = User.objects.create_user(
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                user_type=user_data['user_type'],
                is_active=user_data['is_active'],
                is_verified=user_data['is_verified'],
            )
            created_users.append(user)
            print(f"✅ Created user: {user.email} ({user.user_type})")
            
            # Create profile for some users
            if user.user_type == 'job_seeker':
                profile = UserProfile.objects.create(
                    user=user,
                    bio=f'Test bio for {user.first_name}',
                    phone='1234567890',
                    current_job_title='Software Developer',
                    experience_level='mid',
                    is_open_to_work=True,
                )
                print(f"  📝 Created profile for {user.email}")
                
                # Create experience for some users
                if user.email == 'test_jobseeker1@example.com':
                    experience = UserExperience.objects.create(
                        user=user,
                        job_title='Software Developer',
                        company_name='Tech Corp',
                        start_date='2023-01-01',
                        description='Full-stack development',
                    )
                    print(f"  💼 Created experience for {user.email}")
                
                # Create education for some users
                if user.email == 'test_jobseeker2@example.com':
                    education = UserEducation.objects.create(
                        user=user,
                        degree='Bachelor of Science',
                        field_of_study='Computer Science',
                        school_name='University of Technology',
                        start_date='2019-01-01',
                        end_date='2023-01-01',
                    )
                    print(f"  🎓 Created education for {user.email}")
                    
        except Exception as e:
            print(f"❌ Failed to create user {user_data['email']}: {str(e)}")
    
    print(f"\n🎉 Created {len(created_users)} test users")
    
    # Show current database state
    print("\n📊 Current Database State:")
    print("=" * 30)
    
    all_users = User.objects.all()
    print(f"Total users: {all_users.count()}")
    
    active_users = User.objects.filter(is_active=True)
    print(f"Active users: {active_users.count()}")
    
    verified_users = User.objects.filter(is_verified=True)
    print(f"Verified users: {verified_users.count()}")
    
    job_seekers = User.objects.filter(user_type='job_seeker')
    print(f"Job seekers: {job_seekers.count()}")
    
    employers = User.objects.filter(user_type='employer')
    print(f"Employers: {employers.count()}")
    
    admins = User.objects.filter(user_type='admin')
    print(f"Admins: {admins.count()}")
    
    deleted_users = User.objects.filter(is_deleted=True)
    print(f"Soft-deleted users: {deleted_users.count()}")
    
    print("\nUser details:")
    for user in all_users:
        print(f"  - {user.email} ({user.user_type}) - Active: {user.is_active}, Verified: {user.is_verified}, Deleted: {user.is_deleted}")

if __name__ == '__main__':
    create_test_users() 