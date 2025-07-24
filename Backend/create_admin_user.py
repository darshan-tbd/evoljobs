#!/usr/bin/env python
"""
Script to create an admin user for the admin dashboard
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
    
    # Check if admin user already exists
    admin_email = 'admin@gmail.com'
    existing_admin = User.objects.filter(email=admin_email).first()
    
    if existing_admin:
        print(f"✅ Admin user already exists: {existing_admin.email}")
        print(f"   Name: {existing_admin.first_name} {existing_admin.last_name}")
        print(f"   Active: {existing_admin.is_active}")
        print(f"   Staff: {existing_admin.is_staff}")
        print(f"   Superuser: {existing_admin.is_superuser}")
        
        # Update admin user to ensure proper permissions
        existing_admin.is_staff = True
        existing_admin.is_superuser = True
        existing_admin.is_active = True
        existing_admin.user_type = 'admin'
        existing_admin.save()
        print("✅ Updated admin user permissions")
        
    else:
        # Create admin user
        admin_user = User.objects.create_user(
            email=admin_email,
            password='admin',
            first_name='Admin',
            last_name='User',
            user_type='admin',
            is_active=True,
            is_staff=True,
            is_superuser=True,
            is_verified=True
        )
        
        # Create user profile
        UserProfile.objects.create(
            user=admin_user,
            bio='System Administrator',
            phone='',
            location_text='',
            skills_text='',
            experience=''
        )
        
        print(f"✅ Created admin user: {admin_user.email}")
        print(f"   Name: {admin_user.first_name} {admin_user.last_name}")
        print(f"   Password: admin")
        print(f"   Staff: {admin_user.is_staff}")
        print(f"   Superuser: {admin_user.is_superuser}")
    
    # Verify admin user can be authenticated
    from django.contrib.auth import authenticate
    authenticated_admin = authenticate(username=admin_email, password='admin')
    
    if authenticated_admin:
        print("✅ Admin authentication test: PASSED")
        print(f"   Can access admin: {authenticated_admin.is_staff}")
        print(f"   Is superuser: {authenticated_admin.is_superuser}")
    else:
        print("❌ Admin authentication test: FAILED")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("💡 Make sure Django is properly configured") 