#!/usr/bin/env python3
"""
Redis Setup and Real-time Notifications Test Script
==================================================

This script helps you:
1. Check if Redis is installed and running
2. Install Redis if needed (Windows)
3. Test the real-time notification system
4. Create test notifications to verify end-to-end functionality

Usage:
    python setup_redis_and_test.py
"""

import os
import sys
import subprocess
import time
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.notifications.utils import send_user_notification
from apps.notifications.services import NotificationService

User = get_user_model()

def check_redis_connection():
    """Check if Redis is running"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis is running and accessible")
        return True
    except ImportError:
        print("❌ Redis Python client not installed")
        print("   Run: pip install redis")
        return False
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False

def install_redis_windows():
    """Help install Redis on Windows"""
    print("\n📦 Redis Installation for Windows:")
    print("="*50)
    print("1. Download Redis for Windows:")
    print("   https://github.com/microsoftarchive/redis/releases")
    print("   - Download Redis-x64-3.0.504.msi or latest version")
    print()
    print("2. Or use Chocolatey:")
    print("   choco install redis-64")
    print()
    print("3. Or use WSL (Windows Subsystem for Linux):")
    print("   wsl --install")
    print("   sudo apt update")
    print("   sudo apt install redis-server")
    print("   redis-server")
    print()
    print("4. Or use Docker:")
    print("   docker run -d -p 6379:6379 redis:alpine")
    print()

def test_notification_system():
    """Test the real-time notification system"""
    print("\n🧪 Testing Real-time Notification System")
    print("="*50)
    
    # Get test user
    user = User.objects.first()
    if not user:
        print("❌ No users found in database")
        print("   Create a user first: python manage.py createsuperuser")
        return False
    
    print(f"✅ Testing with user: {user.email}")
    
    # Test 1: Direct utility function
    print("\n📡 Test 1: Direct WebSocket message...")
    test_message = {
        'id': 'test-123',
        'title': '🧪 Test Notification',
        'message': 'This is a direct WebSocket test message!',
        'notification_type': 'test',
        'priority': 'high',
        'created_at': '2024-01-01T12:00:00Z',
        'action_url': '/dashboard',
        'action_label': 'Go to Dashboard'
    }
    
    success = send_user_notification(user.id, test_message)
    if success:
        print("✅ Direct WebSocket message sent successfully")
    else:
        print("❌ Failed to send direct WebSocket message")
    
    # Test 2: Full notification service
    print("\n📝 Test 2: Full notification service...")
    try:
        service = NotificationService()
        notification = service.create_notification(
            user=user,
            notification_type='test',
            title='🔔 Full System Test',
            message='This tests the complete notification pipeline!',
            priority='high',
            delivery_method='realtime',
            action_url='/notifications',
            action_label='View All'
        )
        print(f"✅ Full notification created: {notification.id}")
    except Exception as e:
        print(f"❌ Failed to create notification: {e}")
        return False
    
    # Test 3: Multiple notifications
    print("\n🔄 Test 3: Multiple notifications...")
    for i in range(3):
        try:
            notification = service.create_notification(
                user=user,
                notification_type='job_alert',
                title=f'🎯 Job Alert #{i+1}',
                message=f'New job opportunity {i+1} matching your skills!',
                priority='medium',
                delivery_method='realtime'
            )
            print(f"✅ Created notification {i+1}: {notification.id}")
            time.sleep(1)  # Small delay to see real-time updates
        except Exception as e:
            print(f"❌ Failed to create notification {i+1}: {e}")
    
    print("\n🎉 Testing completed!")
    print("\n📋 Next Steps:")
    print("1. Open your browser to: http://localhost:3000")
    print("2. Login to your account")
    print("3. Go to: http://localhost:3000/notifications")
    print("4. You should see the test notifications appear!")
    print("5. For real-time testing, keep the page open and run this script again")
    
    return True

def main():
    """Main function"""
    print("🔔 Real-time Notifications Setup & Test")
    print("="*50)
    
    # Check Redis
    if not check_redis_connection():
        install_redis_windows()
        print("\n⚠️  Please install and start Redis, then run this script again.")
        return
    
    # Test notification system
    test_notification_system()

if __name__ == "__main__":
    main() 