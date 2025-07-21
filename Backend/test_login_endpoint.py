#!/usr/bin/env python
import os
import django
import requests
import json

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Check user exists
print("=== CHECKING USER ===")
try:
    user = User.objects.get(email='admin1@gmail.com')
    print(f"✅ User found: {user.email}")
    print(f"Active: {user.is_active}")
    print(f"Staff: {user.is_staff}")
    
    # Test password
    is_valid = user.check_password('admin1')
    print(f"Password 'admin1' valid: {is_valid}")
    
except User.DoesNotExist:
    print("❌ User not found")

print("\n=== TESTING LOGIN ENDPOINT ===")

# Test login endpoint
try:
    response = requests.post('http://localhost:8000/api/v1/auth/login/', 
                           json={'email': 'admin1@gmail.com', 'password': 'admin1'},
                           timeout=5)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ LOGIN SUCCESSFUL!")
        print(f"User: {data.get('user', {}).get('email', 'N/A')}")
        print(f"Access Token: {data.get('tokens', {}).get('access', 'N/A')[:50]}...")
    else:
        print(f"❌ LOGIN FAILED: {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to Django server. Make sure it's running on localhost:8000")
except Exception as e:
    print(f"❌ Error: {e}") 