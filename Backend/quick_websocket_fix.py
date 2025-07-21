#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

def quick_fix():
    print("🔧 WEBSOCKET ISSUE DIAGNOSIS")
    print("=" * 50)
    
    # Generate fresh token
    User = get_user_model()
    user = User.objects.get(email='admin1@gmail.com')
    token = AccessToken.for_user(user)
    token_str = str(token)
    
    print(f"✅ Fresh token generated")
    print(f"Token (first 50 chars): {token_str[:50]}...")
    
    print(f"\n🎯 EXACT PROBLEM:")
    print("Your notifications are loading (API works)")
    print("But WebSocket shows disconnected (WebSocket broken)")
    
    print(f"\n💡 LIKELY CAUSES:")
    print("1. Frontend using old cached code")
    print("2. Browser not sending token correctly") 
    print("3. WebSocket middleware not processing token")
    
    print(f"\n🔧 IMMEDIATE FIX:")
    print("1. HARD REFRESH: Ctrl+Shift+R")
    print("2. Clear browser cache")
    print("3. Check dev console for WebSocket errors")
    
    print(f"\n📋 BROWSER TEST:")
    print("In browser console, run:")
    print("localStorage.setItem('access_token', '" + token_str + "');")
    print("Then refresh the page")
    
    print(f"\n⚡ IF STILL NOT WORKING:")
    print("The frontend hook might not be updated. Need to restart Next.js:")
    print("cd Frontend && npm run dev")

if __name__ == "__main__":
    quick_fix() 