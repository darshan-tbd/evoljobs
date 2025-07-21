#!/usr/bin/env python3

import os
import sys
import django
import requests
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from apps.notifications.models import Notification
from apps.notifications.utils import send_user_notification

def test_auth_and_notifications():
    print("🔍 Testing Authentication and Notifications...")
    print("-" * 50)
    
    User = get_user_model()
    
    # Check if admin1@gmail.com user exists
    try:
        user = User.objects.get(email='admin1@gmail.com')
        print(f"✅ Found user: {user.email} (ID: {user.id})")
    except User.DoesNotExist:
        print("❌ User admin1@gmail.com not found")
        return
    
    # Check if user has any tokens
    try:
        token, created = Token.objects.get_or_create(user=user)
        print(f"✅ Token for user: {token.key[:10]}...")
        if created:
            print("   (New token created)")
    except Exception as e:
        print(f"❌ Token error: {e}")
        return
    
    # Check notifications for this user
    notifications = Notification.objects.filter(user=user).order_by('-created_at')
    print(f"✅ Found {notifications.count()} notifications for user")
    
    if notifications.count() > 0:
        print("   Recent notifications:")
        for n in notifications[:3]:
            print(f"   - {n.message[:50]} (Read: {n.is_read})")
    
    # Test API with token
    headers = {
        'Authorization': f'Token {token.key}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get('http://localhost:8000/api/v1/notifications/', headers=headers)
        print(f"\n🌐 API Test: Status {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   API returned {len(data.get('results', []))} notifications")
        else:
            print(f"   API Error: {response.text}")
    except Exception as e:
        print(f"❌ API request failed: {e}")
    
    # Create a new test notification
    print("\n📤 Creating new test notification...")
    try:
        send_user_notification(user.id, "🔄 Frontend debug test - please refresh your browser!", 
                             notification_type="test", title="Debug Test")
        print("✅ New notification created successfully!")
    except Exception as e:
        print(f"❌ Failed to create notification: {e}")
    
    print("\n" + "="*60)
    print("🎯 SOLUTION FOR USER:")
    print("1. Make sure you're logged in on the frontend")
    print("2. Your browser should have a valid token in localStorage")
    print("3. Refresh the notifications page after logging in")
    print("4. Check browser console for any errors")
    print("="*60)

if __name__ == "__main__":
    test_auth_and_notifications() 