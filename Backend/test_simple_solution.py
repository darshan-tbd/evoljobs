#!/usr/bin/env python3

import os
import sys
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.notifications.models import Notification
from apps.notifications.utils import send_user_notification

def main():
    print("🔧 NOTIFICATION SYSTEM DEBUG")
    print("=" * 50)
    
    User = get_user_model()
    
    # Show notifications in database
    user = User.objects.get(email='admin1@gmail.com')
    notifications = Notification.objects.filter(user=user).order_by('-created_at')
    
    print(f"📊 Database Status:")
    print(f"   User: {user.email}")
    print(f"   Notifications in DB: {notifications.count()}")
    
    if notifications.count() > 0:
        print("   Recent notifications:")
        for i, n in enumerate(notifications[:3], 1):
            print(f"   {i}. {n.title} - {n.message[:40]}...")
    
    # Test API endpoint without auth (to see the error)
    print(f"\n🌐 API Test (no auth):")
    try:
        response = requests.get('http://localhost:8000/api/v1/notifications/')
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Create a fresh notification for testing
    print(f"\n🚀 Creating fresh test notification...")
    send_user_notification(
        user.id, 
        "🔴 URGENT: This notification should appear in your browser immediately after you log in!", 
        notification_type="test", 
        title="Authentication Test"
    )
    print("   ✅ Notification created!")
    
    print(f"\n🎯 ROOT CAUSE & SOLUTION:")
    print("=" * 50)
    print("❌ PROBLEM: Frontend is not authenticated")
    print("   The notifications API requires login, but frontend user isn't logged in")
    print()
    print("✅ SOLUTION:")
    print("1. 🔑 GO TO: http://localhost:3000/login")
    print("2. 📧 LOGIN WITH: admin1@gmail.com")
    print("3. 🔄 REFRESH: http://localhost:3000/notifications")
    print("4. 🎉 You should see all your notifications!")
    print()
    print(f"📱 Expected Result: {notifications.count()} notifications should appear")
    print("🔴 Status Indicator: Should show green 🟢 when connected")
    print("=" * 50)

if __name__ == "__main__":
    main() 