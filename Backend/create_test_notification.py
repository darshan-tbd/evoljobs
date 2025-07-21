#!/usr/bin/env python3
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.notifications.services import NotificationService

User = get_user_model()
service = NotificationService()

# Create test notification for the admin user
user = User.objects.filter(email='admin1@gmail.com').first()
if user:
    notification = service.create_notification(
        user=user,
        notification_type='test',
        title='🔔 Real-time Test Notification',
        message='This should appear instantly in your browser!',
        priority='high',
        delivery_method='realtime'
    )
    print(f'✅ Created notification: {notification.id}')
    print(f'📧 For user: {user.email}')
    print(f'🔔 Check your browser at localhost:3000 - it should appear instantly!')
else:
    print('❌ User admin1@gmail.com not found')
    print('Available users:')
    for u in User.objects.all():
        print(f'  - {u.email}') 