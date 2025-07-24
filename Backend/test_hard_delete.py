#!/usr/bin/env python
"""
Test script to verify hard delete functionality directly in Django
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

def test_hard_delete():
    """Test hard delete functionality directly"""
    
    print("🧪 Testing Hard Delete Functionality")
    print("=" * 50)
    
    # Get all users
    all_users = User.objects.all()
    print(f"Total users in database: {all_users.count()}")
    
    # Show all users
    for user in all_users:
        print(f"  - {user.email} (ID: {user.id}) - is_deleted: {user.is_deleted}")
    
    # Find a test user to delete
    test_user = None
    for user in all_users:
        if not user.is_superuser and not user.is_deleted:
            test_user = user
            break
    
    if not test_user:
        print("❌ No suitable test user found")
        return
    
    print(f"\n🎯 Testing hard delete for: {test_user.email} (ID: {test_user.id})")
    
    # Check if user has related data
    try:
        profile = UserProfile.objects.get(user=test_user)
        print(f"✅ User has profile: {profile.id}")
    except UserProfile.DoesNotExist:
        print("ℹ️ User has no profile")
    
    experiences = UserExperience.objects.filter(user=test_user)
    print(f"ℹ️ User has {experiences.count()} experience records")
    
    educations = UserEducation.objects.filter(user=test_user)
    print(f"ℹ️ User has {educations.count()} education records")
    
    # Perform hard delete
    print(f"\n🗑️ Performing hard delete...")
    test_user.hard_delete()
    
    # Verify user is deleted
    try:
        deleted_user = User.objects.get(id=test_user.id)
        print(f"❌ User still exists: {deleted_user.email}")
        print(f"   is_deleted: {deleted_user.is_deleted}")
    except User.DoesNotExist:
        print("✅ User successfully hard deleted from database")
        
        # Check if related data is also deleted
        try:
            profile = UserProfile.objects.get(user_id=test_user.id)
            print(f"❌ UserProfile still exists")
        except UserProfile.DoesNotExist:
            print("✅ UserProfile also deleted (cascade working)")
        
        experiences = UserExperience.objects.filter(user_id=test_user.id)
        if experiences.exists():
            print(f"❌ UserExperience records still exist")
        else:
            print("✅ UserExperience records also deleted (cascade working)")
        
        educations = UserEducation.objects.filter(user_id=test_user.id)
        if educations.exists():
            print(f"❌ UserEducation records still exist")
        else:
            print("✅ UserEducation records also deleted (cascade working)")
    
    # Show remaining users
    remaining_users = User.objects.all()
    print(f"\n📊 Remaining users: {remaining_users.count()}")
    for user in remaining_users:
        print(f"  - {user.email} (ID: {user.id}) - is_deleted: {user.is_deleted}")

if __name__ == '__main__':
    test_hard_delete() 