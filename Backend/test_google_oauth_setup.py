#!/usr/bin/env python
"""
Quick test script to verify Google OAuth setup for JobPilot
Run this after setting up your Google Cloud Console credentials
"""

import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

def test_google_oauth_setup():
    """Test Google OAuth configuration"""
    
    print("🔍 Testing Google OAuth Setup...")
    print("=" * 50)
    
    # Check environment variables
    required_vars = [
        'GOOGLE_OAUTH_CLIENT_ID',
        'GOOGLE_OAUTH_CLIENT_SECRET', 
        'GOOGLE_OAUTH_REDIRECT_URI',
        'GOOGLE_TOKEN_ENCRYPTION_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        value = getattr(settings, var, None)
        if value:
            print(f"✅ {var}: {'*' * 10}...{value[-10:] if len(value) > 10 else value}")
        else:
            print(f"❌ {var}: NOT SET")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please add these to your .env.local file")
        return False
    
    # Test encryption key
    try:
        from cryptography.fernet import Fernet
        key = getattr(settings, 'GOOGLE_TOKEN_ENCRYPTION_KEY', '')
        f = Fernet(key.encode() if isinstance(key, str) else key)
        test_token = "test_token_12345"
        encrypted = f.encrypt(test_token.encode())
        decrypted = f.decrypt(encrypted).decode()
        
        if decrypted == test_token:
            print("✅ Encryption/Decryption: Working")
        else:
            print("❌ Encryption/Decryption: Failed")
            return False
            
    except Exception as e:
        print(f"❌ Encryption test failed: {e}")
        return False
    
    # Test Google OAuth service initialization
    try:
        from apps.google_integration.services import GoogleOAuthService
        oauth_service = GoogleOAuthService()
        
        if oauth_service.client_id and oauth_service.client_secret and oauth_service.redirect_uri:
            print("✅ GoogleOAuthService: Initialized successfully")
        else:
            print("❌ GoogleOAuthService: Missing credentials")
            return False
            
    except Exception as e:
        print(f"❌ GoogleOAuthService initialization failed: {e}")
        return False
    
    # Test database models
    try:
        from apps.google_integration.models import GoogleIntegration
        count = GoogleIntegration.objects.count()
        print(f"✅ Database Models: Working (found {count} integrations)")
    except Exception as e:
        print(f"❌ Database models test failed: {e}")
        return False
    
    print("\n🎉 All tests passed! Your Google OAuth setup is ready.")
    print("\nNext steps:")
    print("1. Start your Django development server")
    print("2. Go to the Google Integration page in your frontend")
    print("3. Click 'Connect Google Account' to test the OAuth flow")
    
    return True

if __name__ == "__main__":
    test_google_oauth_setup() 