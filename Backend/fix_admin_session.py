#!/usr/bin/env python3
"""
Quick fix for admin session - get fresh user data with admin permissions
"""
import requests
import json

def fix_admin_session():
    print("🔧 Quick Admin Session Fix")
    print("=" * 40)
    
    # Test endpoints
    base_url = "http://127.0.0.1:8000/api/v1"
    
    print("📋 To fix your admin access:")
    print("1. Get your current access token from browser localStorage")
    print("2. Call the profile endpoint to get fresh user data")
    print("3. Frontend will update with admin permissions")
    
    print(f"\n🌐 Test these endpoints in your browser:")
    print(f"   - Profile: {base_url}/auth/profile/")
    print(f"   - Status: {base_url}/auth/status/")
    print(f"   - Jobs (admin): {base_url}/jobs/jobs/?admin=true")
    
    print(f"\n💡 JavaScript fix (run in browser console):")
    print(f"""
// Get fresh user data and update localStorage
fetch('{base_url}/auth/profile/', {{
    headers: {{
        'Authorization': 'Bearer ' + localStorage.getItem('access_token')
    }}
}})
.then(response => response.json())
.then(userData => {{
    console.log('Fresh user data:', userData);
    // Force refresh the page to reload auth context
    window.location.reload();
}});
    """)
    
    print(f"\n⚡ Or simply:")
    print("   1. Open browser console (F12)")
    print("   2. Run: window.location.reload()")
    print("   3. Your admin access should work!")

if __name__ == "__main__":
    fix_admin_session() 