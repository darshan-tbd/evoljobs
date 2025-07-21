#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
users = User.objects.all()

print("=== ALL USERS ===")
for user in users:
    print(f"Email: {user.email} | Active: {user.is_active} | Staff: {user.is_staff}")

print(f"\nTotal users: {users.count()}") 