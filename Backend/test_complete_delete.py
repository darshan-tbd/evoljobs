#!/usr/bin/env python
"""
Comprehensive test for user delete functionality
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

def test_complete_delete_functionality():
    """Test the complete delete functionality"""
    
    print("🧪 Testing Complete User Delete Functionality")
    print("=" * 60)
    
    # Clean up any existing test data
    print("0️⃣ Cleaning up existing test data...")
    User.objects.filter(email__startswith='test_delete').delete()
    print("✅ Cleanup completed")
    
    # Create a test user with related data
    print("1️⃣ Creating test user with related data...")
    
    import uuid
    unique_email = f'test_delete_{uuid.uuid4().hex[:8]}@example.com'
    
    test_user = User.objects.create_user(
        email=unique_email,
        password='testpass123',
        first_name='Test',
        last_name='Delete',
        user_type='job_seeker'
    )
    
    # Create profile
    profile = UserProfile.objects.create(
        user=test_user,
        bio='Test bio',
        phone='1234567890',
        current_job_title='Software Developer'
    )
    
    # Create experience
    experience = UserExperience.objects.create(
        user=test_user,
        job_title='Software Developer',
        company_name='Test Company',
        start_date='2023-01-01',
        description='Test experience'
    )
    
    # Create education
    education = UserEducation.objects.create(
        user=test_user,
        degree='Bachelor of Science',
        field_of_study='Computer Science',
        school_name='Test University',
        start_date='2019-01-01',
        end_date='2023-01-01'
    )
    
    print(f"✅ Created test user: {test_user.email} (ID: {test_user.id})")
    print(f"✅ Created profile: {profile.id}")
    print(f"✅ Created experience: {experience.id}")
    print(f"✅ Created education: {education.id}")
    
    # Verify data exists
    print("\n2️⃣ Verifying data exists...")
    assert User.objects.filter(id=test_user.id).exists(), "User should exist"
    assert UserProfile.objects.filter(user=test_user).exists(), "Profile should exist"
    assert UserExperience.objects.filter(user=test_user).exists(), "Experience should exist"
    assert UserEducation.objects.filter(user=test_user).exists(), "Education should exist"
    print("✅ All data exists")
    
    # Test hard delete directly
    print("\n3️⃣ Testing hard delete...")
    
    # Perform hard delete
    test_user.hard_delete()
    
    print("✅ Hard delete completed")
    
    # Verify user is permanently deleted
    print("\n4️⃣ Verifying permanent deletion...")
    
    try:
        deleted_user = User.objects.get(id=test_user.id)
        print(f"❌ User still exists: {deleted_user.email}")
        print(f"   is_deleted: {deleted_user.is_deleted}")
        assert False, "User should be permanently deleted"
    except User.DoesNotExist:
        print("✅ User permanently deleted from database")
    
    # Verify related data is also deleted
    try:
        profile = UserProfile.objects.get(user_id=test_user.id)
        print(f"❌ UserProfile still exists")
        assert False, "UserProfile should be deleted"
    except UserProfile.DoesNotExist:
        print("✅ UserProfile also deleted (cascade working)")
    
    experiences = UserExperience.objects.filter(user_id=test_user.id)
    if experiences.exists():
        print(f"❌ UserExperience records still exist")
        assert False, "UserExperience should be deleted"
    else:
        print("✅ UserExperience records also deleted (cascade working)")
    
    educations = UserEducation.objects.filter(user_id=test_user.id)
    if educations.exists():
        print(f"❌ UserEducation records still exist")
        assert False, "UserEducation should be deleted"
    else:
        print("✅ UserEducation records also deleted (cascade working)")
    
    print("\n🎉 All tests passed! User delete functionality is working correctly.")
    
    # Show remaining users
    remaining_users = User.objects.all()
    print(f"\n📊 Remaining users: {remaining_users.count()}")
    for user in remaining_users:
        print(f"  - {user.email} (ID: {user.id}) - is_deleted: {user.is_deleted}")

if __name__ == '__main__':
    test_complete_delete_functionality() 