#!/usr/bin/env python3

import os
import sys
import django
import time

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.notifications.models import Notification
from apps.notifications.utils import send_user_notification

def test_live_data():
    print("🔍 TESTING IF FRONTEND SHOWS REAL DATA")
    print("=" * 60)
    
    User = get_user_model()
    user = User.objects.get(email='admin1@gmail.com')
    
    # Show current notifications in database
    notifications = Notification.objects.filter(user=user).order_by('-created_at')
    print(f"📊 Current database notifications: {notifications.count()}")
    
    print("\n📋 Database notifications (latest 8):")
    for i, n in enumerate(notifications[:8], 1):
        print(f"   {i}. {n.title}")
        print(f"      Message: {n.message[:60]}...")
        print(f"      Created: {n.created_at}")
        print()
    
    # Create a UNIQUE test notification with timestamp
    timestamp = int(time.time())
    test_title = f"🔥 LIVE TEST #{timestamp}"
    test_message = f"This notification was created at {time.strftime('%H:%M:%S')} - if you see this, the frontend is showing REAL database data!"
    
    print(f"🚀 Creating unique test notification...")
    print(f"   Title: {test_title}")
    print(f"   Message: {test_message}")
    
    send_user_notification(
        user.id,
        test_message,
        title=test_title
    )
    
    print(f"\n✅ New notification created!")
    print(f"🎯 VERIFICATION STEPS:")
    print(f"1. Check your browser at http://localhost:3000/notifications")
    print(f"2. Look for the notification: '{test_title}'")
    print(f"3. If you see it instantly without refreshing, it's REAL-TIME!")
    print(f"4. If you don't see it, then it's showing MOCK DATA")
    print("=" * 60)
    
    # Final count
    new_count = Notification.objects.filter(user=user).count()
    print(f"📈 Total notifications now: {new_count}")
    print(f"🔴 You should see {new_count} notifications in your browser")

if __name__ == "__main__":
    test_live_data() 