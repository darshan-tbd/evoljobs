#!/usr/bin/env python3
"""
Real-time Notifications Quick Test
=================================

This script tests the real-time notification system.
Place this file in your Backend directory and run it.

Usage:
    python notifications_test.py
"""

import os
import sys
import asyncio
import json
import django
from pathlib import Path

# Add the Backend directory to Python path
backend_dir = Path(__file__).parent / "Backend"
sys.path.insert(0, str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

try:
    django.setup()
    
    from django.contrib.auth import get_user_model
    from apps.notifications.services import NotificationService
    from apps.notifications.models import Notification
    
    User = get_user_model()
    
    def test_notifications():
        print("🔔 Testing Real-time Notifications System")
        print("=" * 50)
        
        # Create test user
        test_user, created = User.objects.get_or_create(
            email="test@example.com",
            defaults={
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        
        if created:
            test_user.set_password("testpass123")
            test_user.save()
            print(f"✓ Created test user: {test_user.email}")
        else:
            print(f"✓ Using existing test user: {test_user.email}")
        
        # Test notification service
        service = NotificationService()
        
        # Create test notifications
        test_cases = [
            {
                'type': 'job_alert',
                'title': 'New Job Alert',
                'message': 'A new job matching your criteria has been posted.',
                'priority': 'high'
            },
            {
                'type': 'application_update',
                'title': 'Application Status Update',
                'message': 'Your application status has been updated.',
                'priority': 'medium'
            },
            {
                'type': 'system',
                'title': 'System Test',
                'message': 'This is a test notification for real-time delivery.',
                'priority': 'low'
            }
        ]
        
        created_notifications = []
        for case in test_cases:
            try:
                notification = service.create_notification(
                    user=test_user,
                    notification_type=case['type'],
                    title=case['title'],
                    message=case['message'],
                    priority=case['priority'],
                    delivery_method='realtime'
                )
                created_notifications.append(notification)
                print(f"✓ Created {case['type']} notification: {notification.id}")
            except Exception as e:
                print(f"✗ Failed to create {case['type']} notification: {e}")
        
        # Display results
        print(f"\n📊 Test Results:")
        print(f"   Created {len(created_notifications)} notifications")
        
        total_notifications = Notification.objects.filter(user=test_user).count()
        print(f"   Total notifications for user: {total_notifications}")
        
        # Cleanup
        print(f"\n🧹 Cleanup:")
        deleted_count = Notification.objects.filter(user=test_user).delete()[0]
        print(f"   Deleted {deleted_count} test notifications")
        
        print("\n✅ Test completed successfully!")
        print("\nNext steps:")
        print("1. Start your Django server: python manage.py runserver")
        print("2. Open the HTML test file in your browser")
        print("3. Connect to WebSocket and test real-time delivery")
        
    if __name__ == "__main__":
        test_notifications()
        
except ImportError as e:
    print(f"❌ Django setup failed: {e}")
    print("Make sure you're running this from the project root directory")
    print("and that Django is properly configured.") 