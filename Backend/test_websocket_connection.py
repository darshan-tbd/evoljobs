#!/usr/bin/env python3

import asyncio
import websockets
import json
import requests
import sys

async def test_websocket_connection():
    print("🔍 WEBSOCKET CONNECTION DEBUG")
    print("=" * 50)
    
    # Test 1: Get a valid JWT token
    print("1. Testing authentication...")
    try:
        auth_response = requests.post('http://localhost:8000/api/v1/auth/login/', {
            'email': 'admin1@gmail.com',
            'password': 'your_password_here'  # You'll need to replace this
        })
        
        if auth_response.status_code == 200:
            token = auth_response.json().get('access')
            print(f"   ✅ Got JWT token: {token[:20]}...")
        else:
            print(f"   ❌ Auth failed: {auth_response.status_code}")
            print(f"   Response: {auth_response.text}")
            
            # Try to use a token from localStorage simulation
            print("   🔄 Using simulated token for testing...")
            token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"  # Dummy token for testing
            
    except Exception as e:
        print(f"   ❌ Auth error: {e}")
        token = "test_token"
    
    # Test 2: Try WebSocket connection
    print(f"\n2. Testing WebSocket connection...")
    ws_url = f"ws://localhost:8000/ws/notifications/?token={token}"
    print(f"   URL: {ws_url}")
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("   ✅ WebSocket connected!")
            
            # Send a test message
            await websocket.send(json.dumps({"type": "heartbeat"}))
            print("   📤 Sent heartbeat")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"   📥 Received: {response}")
            except asyncio.TimeoutError:
                print("   ⏰ No response received")
                
    except websockets.exceptions.ConnectionClosed as e:
        print(f"   ❌ Connection closed: {e}")
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"   ❌ Invalid status code: {e}")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
    
    # Test 3: Check without token
    print(f"\n3. Testing without token...")
    try:
        async with websockets.connect("ws://localhost:8000/ws/notifications/") as websocket:
            print("   ⚠️  Connected without token (unexpected)")
    except Exception as e:
        print(f"   ✅ Correctly rejected without token: {e}")
    
    print(f"\n🎯 DEBUGGING TIPS:")
    print("- Check Django server logs for WebSocket errors")
    print("- Verify JWT token is valid")
    print("- Check if middleware is loaded correctly")
    print("- Ensure Redis is running")

if __name__ == "__main__":
    try:
        asyncio.run(test_websocket_connection())
    except KeyboardInterrupt:
        print("\n�� Test interrupted") 