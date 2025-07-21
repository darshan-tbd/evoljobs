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

def main():
    print("🔍 VERIFICATION: Is Frontend Showing Real Database Data?")
    print("=" * 60)
    
    User = get_user_model()
    user = User.objects.get(email='admin1@gmail.com')
    
    # Show current database notifications
    current_notifications = Notification.objects.filter(user=user).order_by('-created_at')
    
    print("📊 Database notifications (titles only):")
    for i, n in enumerate(current_notifications[:8], 1):
        print(f"   {i}. {n.title}")
    
    # Compare with what user sees in browser
    frontend_titles = [
        "NEW JOB ALERT - Live Test!",
        "REAL-TIME WORKING!",
        "Real-time Test #3",
        "Real-time Test #2", 
        "Real-time Test #1"
    ]
    
    print(f"\n🌐 Frontend showing (from screenshot):")
    for i, title in enumerate(frontend_titles, 1):
        print(f"   {i}. {title}")
    
    # Check for matches
    print(f"\n🔍 ANALYSIS:")
    db_titles = [n.title for n in current_notifications[:5]]
    matches = 0
    for title in frontend_titles:
        if title in db_titles:
            matches += 1
            print(f"   ✅ MATCH: '{title}' found in database")
        else:
            print(f"   ❌ NO MATCH: '{title}' NOT in database")
    
    print(f"\n🎯 RESULT:")
    if matches >= 4:
        print("   ✅ FRONTEND IS SHOWING REAL DATABASE DATA!")
        print("   ✅ Your notification system is working with live data")
    else:
        print("   ❌ Frontend might be showing mock data")
    
    # Create unique test notification
    timestamp = int(time.time())
    unique_title = f"🔥 LIVE VERIFICATION #{timestamp}"
    
    Notification.objects.create(
        user=user,
        title=unique_title,
        message=f"Created at {time.strftime('%H:%M:%S')} to verify real-time data",
        notification_type='test'
    )
    
    print(f"\n🚀 LIVE TEST:")
    print(f"   Just created: '{unique_title}'")
    print(f"   If this appears in your browser instantly, it's REAL-TIME!")
    print(f"   Total notifications: {Notification.objects.filter(user=user).count()}")

if __name__ == "__main__":
    main() 