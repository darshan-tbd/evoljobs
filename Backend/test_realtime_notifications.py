#!/usr/bin/env python3
"""
Real-time Notifications Test Script
==================================

This script tests the real-time notification system including:
- WebSocket connections
- Notification creation and delivery
- User preferences
- Different notification types

Usage:
    python test_realtime_notifications.py
"""

import os
import sys
import asyncio
import json
import websockets
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

# Setup Django
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification, NotificationPreference

User = get_user_model()

class NotificationTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.ws_url = "ws://localhost:8000/ws/notifications/"
        self.client = Client()
        self.notification_service = NotificationService()
        self.test_user = None
        self.websocket = None
        
    def setup_test_user(self):
        """Create or get test user"""
        try:
            self.test_user = User.objects.get(email="test@example.com")
            print(f"✓ Using existing test user: {self.test_user.email}")
        except User.DoesNotExist:
            self.test_user = User.objects.create_user(
                email="test@example.com",
                password="testpass123",
                first_name="Test",
                last_name="User"
            )
            print(f"✓ Created new test user: {self.test_user.email}")
        
        # Ensure notification preferences exist
        prefs, created = NotificationPreference.objects.get_or_create(
            user=self.test_user,
            defaults={
                'realtime_job_alerts': True,
                'realtime_application_updates': True,
                'realtime_interview_invitations': True,
                'realtime_job_recommendations': True,
                'realtime_messages': True,
                'realtime_system_notifications': True,
            }
        )
        if created:
            print("✓ Created notification preferences")
        else:
            print("✓ Notification preferences already exist")
    
    def test_notification_creation(self):
        """Test notification creation and storage"""
        print("\n=== Testing Notification Creation ===")
        
        # Test different notification types
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
                'message': 'Your application for Software Engineer position has been reviewed.',
                'priority': 'medium'
            },
            {
                'type': 'system',
                'title': 'System Maintenance',
                'message': 'Scheduled maintenance will begin in 30 minutes.',
                'priority': 'low'
            }
        ]
        
        notifications = []
        for case in test_cases:
            try:
                notification = self.notification_service.create_notification(
                    user=self.test_user,
                    notification_type=case['type'],
                    title=case['title'],
                    message=case['message'],
                    priority=case['priority'],
                    action_url=f"/dashboard/{case['type']}",
                    action_label="View Details",
                    delivery_method='realtime'
                )
                notifications.append(notification)
                print(f"✓ Created {case['type']} notification: {notification.id}")
            except Exception as e:
                print(f"✗ Failed to create {case['type']} notification: {e}")
        
        print(f"✓ Created {len(notifications)} notifications")
        return notifications
    
    def test_api_endpoints(self):
        """Test notification API endpoints"""
        print("\n=== Testing API Endpoints ===")
        
        # Login first
        login_response = self.client.post('/api/v1/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        
        if login_response.status_code != 200:
            print(f"✗ Login failed: {login_response.status_code}")
            return
        
        token = login_response.json().get('access')
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test endpoints
        endpoints = [
            ('/api/v1/notifications/', 'GET', 'List notifications'),
            ('/api/v1/notifications/unread/', 'GET', 'Get unread notifications'),
            ('/api/v1/notifications/unread_count/', 'GET', 'Get unread count'),
            ('/api/v1/notifications/preferences/', 'GET', 'Get preferences'),
        ]
        
        for endpoint, method, description in endpoints:
            try:
                if method == 'GET':
                    response = self.client.get(endpoint, **headers)
                else:
                    response = self.client.post(endpoint, **headers)
                
                if response.status_code in [200, 201]:
                    print(f"✓ {description}: {response.status_code}")
                else:
                    print(f"✗ {description}: {response.status_code}")
            except Exception as e:
                print(f"✗ {description}: {e}")
    
    def test_websocket_connection(self):
        """Test WebSocket connection and message handling"""
        print("\n=== Testing WebSocket Connection ===")
        
        async def websocket_test():
            try:
                # Create WebSocket connection
                async with websockets.connect(self.ws_url) as websocket:
                    print("✓ WebSocket connection established")
                    
                    # Send authentication message (if needed)
                    await websocket.send(json.dumps({
                        'type': 'authenticate',
                        'user_id': self.test_user.id
                    }))
                    
                    # Listen for initial data
                    initial_message = await websocket.recv()
                    initial_data = json.loads(initial_message)
                    print(f"✓ Received initial data: {initial_data.get('type')}")
                    
                    # Send test messages
                    test_messages = [
                        {'type': 'get_unread_count'},
                        {'type': 'heartbeat'},
                    ]
                    
                    for msg in test_messages:
                        await websocket.send(json.dumps(msg))
                        response = await websocket.recv()
                        response_data = json.loads(response)
                        print(f"✓ {msg['type']} response: {response_data.get('type')}")
                    
                    print("✓ WebSocket test completed successfully")
                    
            except Exception as e:
                print(f"✗ WebSocket test failed: {e}")
        
        # Run the async test
        asyncio.run(websocket_test())
    
    def test_notification_delivery(self):
        """Test real-time notification delivery"""
        print("\n=== Testing Notification Delivery ===")
        
        async def delivery_test():
            try:
                # Connect to WebSocket
                async with websockets.connect(self.ws_url) as websocket:
                    print("✓ WebSocket connected for delivery test")
                    
                    # Create a notification in another thread
                    def create_notification():
                        try:
                            notification = self.notification_service.create_notification(
                                user=self.test_user,
                                notification_type='test',
                                title='Real-time Test Notification',
                                message='This notification should appear in real-time!',
                                priority='high',
                                delivery_method='realtime'
                            )
                            print(f"✓ Created test notification: {notification.id}")
                            return notification
                        except Exception as e:
                            print(f"✗ Failed to create notification: {e}")
                            return None
                    
                    # Start listening for messages
                    async def listen_for_messages():
                        try:
                            while True:
                                message = await websocket.recv()
                                data = json.loads(message)
                                if data.get('type') == 'notification':
                                    print(f"✓ Received real-time notification: {data['data']['title']}")
                                    return True
                                elif data.get('type') == 'initial_data':
                                    print("✓ Received initial data")
                                else:
                                    print(f"• Received message: {data.get('type')}")
                        except Exception as e:
                            print(f"✗ Error listening for messages: {e}")
                            return False
                    
                    # Run notification creation in background
                    with ThreadPoolExecutor() as executor:
                        future = executor.submit(create_notification)
                        
                        # Listen for the notification
                        received = await asyncio.wait_for(listen_for_messages(), timeout=10)
                        
                        if received:
                            print("✓ Real-time notification delivery successful!")
                        else:
                            print("✗ Real-time notification delivery failed!")
                        
                        notification = future.result()
                    
            except asyncio.TimeoutError:
                print("✗ Timeout waiting for real-time notification")
            except Exception as e:
                print(f"✗ Delivery test failed: {e}")
        
        # Run the delivery test
        asyncio.run(delivery_test())
    
    def test_notification_preferences(self):
        """Test notification preference handling"""
        print("\n=== Testing Notification Preferences ===")
        
        # Get current preferences
        prefs = NotificationPreference.objects.get(user=self.test_user)
        
        # Test preference checking
        original_job_alerts = prefs.realtime_job_alerts
        
        # Disable job alerts
        prefs.realtime_job_alerts = False
        prefs.save()
        
        # Create a job alert notification
        notification = self.notification_service.create_notification(
            user=self.test_user,
            notification_type='job_alert',
            title='Job Alert (Should be filtered)',
            message='This should not be sent due to preferences',
            delivery_method='realtime'
        )
        
        print(f"✓ Created notification with preferences disabled: {notification.id}")
        
        # Restore original preference
        prefs.realtime_job_alerts = original_job_alerts
        prefs.save()
        
        print("✓ Notification preferences test completed")
    
    def cleanup(self):
        """Clean up test data"""
        print("\n=== Cleaning Up Test Data ===")
        
        # Delete test notifications
        deleted_count = Notification.objects.filter(user=self.test_user).delete()[0]
        print(f"✓ Deleted {deleted_count} test notifications")
        
        # Optionally delete test user
        # self.test_user.delete()
        # print("✓ Deleted test user")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Real-time Notifications Test Suite")
        print("=" * 50)
        
        try:
            self.setup_test_user()
            
            # Run tests
            self.test_notification_creation()
            self.test_api_endpoints()
            self.test_websocket_connection()
            self.test_notification_delivery()
            self.test_notification_preferences()
            
            print("\n" + "=" * 50)
            print("✅ All tests completed!")
            
        except Exception as e:
            print(f"\n❌ Test suite failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.cleanup()

def main():
    """Main test function"""
    tester = NotificationTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 