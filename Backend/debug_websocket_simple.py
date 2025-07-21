#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

def debug_websocket():
    print("🔍 WEBSOCKET DEBUG - FINDING THE REAL ISSUE")
    print("=" * 60)
    
    # 1. Check Django server status
    import requests
    try:
        response = requests.get('http://localhost:8000/admin/')
        print(f"✅ Django server running: {response.status_code}")
    except Exception as e:
        print(f"❌ Django server not accessible: {e}")
        return
    
    # 2. Generate valid JWT token
    try:
        User = get_user_model()
        user = User.objects.get(email='admin1@gmail.com')
        token = AccessToken.for_user(user)
        token_str = str(token)
        print(f"✅ Generated JWT token: {token_str[:30]}...")
    except Exception as e:
        print(f"❌ Token generation failed: {e}")
        return
    
    # 3. Check if middleware imports work
    try:
        from apps.notifications.middleware import JWTAuthMiddleware
        print("✅ JWT middleware imports successfully")
    except Exception as e:
        print(f"❌ Middleware import failed: {e}")
        return
    
    # 4. Check WebSocket URL pattern
    try:
        from apps.notifications.routing import websocket_urlpatterns
        print(f"✅ WebSocket routes: {websocket_urlpatterns}")
    except Exception as e:
        print(f"❌ WebSocket routing failed: {e}")
        return
    
    # 5. Check Redis connection
    try:
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        print(f"✅ Channel layer: {channel_layer}")
    except Exception as e:
        print(f"❌ Channel layer failed: {e}")
        return
    
    print(f"\n🔧 BROWSER DEBUGGING:")
    print("Open browser dev console (F12) and look for:")
    print("1. WebSocket connection errors")
    print("2. 401 Unauthorized errors")
    print("3. CORS errors")
    print("4. Network tab for failed WS connections")
    
    print(f"\n🎯 QUICK FIX TO TRY:")
    print("1. Open browser dev console")
    print("2. Check Network tab")
    print("3. Look for WebSocket connection attempt")
    print("4. Check error message")
    print("5. Verify localStorage has 'access_token'")
    
    print(f"\n💡 TEST TOKEN IN BROWSER:")
    print("In browser console, run:")
    print(f"localStorage.getItem('access_token')")
    print("If null, you need to login again")

if __name__ == "__main__":
    debug_websocket() 