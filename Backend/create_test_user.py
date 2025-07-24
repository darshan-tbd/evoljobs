#!/usr/bin/env python
"""
Simple script to create a test user for authentication testing
"""
import os
import sys
import django

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

try:
    django.setup()
    
    from django.contrib.auth import get_user_model
    from apps.users.models import UserProfile
    
    User = get_user_model()
    
    # Check if test user already exists
    test_email = 'test@evoljobs.com'
    existing_user = User.objects.filter(email=test_email).first()
    
    if existing_user:
        print(f"✅ Test user already exists: {existing_user.email}")
        print(f"   Name: {existing_user.first_name} {existing_user.last_name}")
        print(f"   Active: {existing_user.is_active}")
    else:
        # Create test user
        user = User.objects.create_user(
            email=test_email,
            password='testpass123',
            first_name='Test',
            last_name='User',
            user_type='job_seeker',
            is_active=True
        )
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            bio='',
            phone='',
            location_text='',
            skills_text='',
            experience=''
        )
        
        print(f"✅ Created test user: {user.email}")
        print(f"   Name: {user.first_name} {user.last_name}")
        print(f"   Password: testpass123")
    
    # Verify user can be authenticated
    from django.contrib.auth import authenticate
    authenticated_user = authenticate(username=test_email, password='testpass123')
    
    if authenticated_user:
        print("✅ User authentication test: PASSED")
    else:
        print("❌ User authentication test: FAILED")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("💡 Make sure Django is properly configured") 