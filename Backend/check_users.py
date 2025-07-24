#!/usr/bin/env python
import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")

try:
    django.setup()
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    print("🔍 Checking existing users in database...")
    users = User.objects.all()
    
    if users.exists():
        print(f"✅ Found {users.count()} users:")
        for user in users:
            print(f"   - {user.email} ({user.first_name} {user.last_name}) - Active: {user.is_active}")
    else:
        print("❌ No users found in database")
        print("💡 You need to create a test user first")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("💡 Make sure Django is properly configured and database is accessible") 