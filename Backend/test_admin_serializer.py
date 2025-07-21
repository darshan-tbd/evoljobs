#!/usr/bin/env python3
"""
Test script to verify UserSerializer includes admin fields
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

django.setup()

from apps.authentication.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

def test_admin_serializer():
    print("🔍 Testing Updated UserSerializer")
    print("=" * 50)
    
    # Get admin user
    user = User.objects.get(email='admin1@gmail.com')
    
    # Test the serializer
    serializer = UserSerializer(user)
    data = serializer.data
    
    print(f"📧 Email: {data['email']}")
    print(f"👤 Name: {data['first_name']} {data['last_name']}")
    print(f"🛡️  is_staff: {data.get('is_staff', 'MISSING!')}")
    print(f"⚡ is_superuser: {data.get('is_superuser', 'MISSING!')}")
    
    if 'is_staff' in data and 'is_superuser' in data:
        print("\n✅ SUCCESS: Admin fields are now included!")
        print("🔧 The frontend will now receive admin permissions")
    else:
        print("\n❌ ERROR: Admin fields still missing")
    
    print(f"\n📋 All fields: {list(data.keys())}")

if __name__ == "__main__":
    test_admin_serializer() 