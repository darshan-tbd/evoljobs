#!/usr/bin/env python
"""
Install and test Redis setup for auto-apply functionality
"""

import os
import sys
import subprocess
import platform

def check_redis_installation():
    """Check if Redis is installed and accessible"""
    try:
        import redis
        print("✅ Redis Python package is installed")
        
        # Try to connect
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis server is running and accessible")
        return True
        
    except ImportError:
        print("❌ Redis Python package not installed")
        print("   💡 Install with: pip install redis")
        return False
    except Exception as e:
        print(f"❌ Redis server not accessible: {e}")
        print("   💡 Redis server is not running")
        return False

def install_redis_python_package():
    """Install Redis Python package"""
    try:
        print("📦 Installing Redis Python package...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "redis"])
        print("✅ Redis Python package installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Redis package: {e}")
        return False

def get_redis_installation_instructions():
    """Get platform-specific Redis installation instructions"""
    system = platform.system().lower()
    
    if system == "windows":
        return """
🔧 INSTALL REDIS ON WINDOWS:

Method 1: Download MSI Installer (Recommended)
1. Go to: https://github.com/microsoftarchive/redis/releases
2. Download: Redis-x64-3.0.504.msi
3. Run the installer with default settings
4. Redis will start automatically as Windows service

Method 2: Using Chocolatey (if you have it)
> choco install redis-64

Method 3: Using Docker (if you have Docker)
> docker run -d -p 6379:6379 --name redis redis:latest

Method 4: Manual Download
1. Download: https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip
2. Extract to C:\\Redis
3. Run: C:\\Redis\\redis-server.exe
"""
    
    elif system == "darwin":  # macOS
        return """
🔧 INSTALL REDIS ON MACOS:

Method 1: Using Homebrew (Recommended)
> brew install redis
> brew services start redis

Method 2: Using MacPorts
> sudo port install redis
"""
    
    else:  # Linux
        return """
🔧 INSTALL REDIS ON LINUX:

Ubuntu/Debian:
> sudo apt update
> sudo apt install redis-server
> sudo systemctl start redis
> sudo systemctl enable redis

CentOS/RHEL:
> sudo yum install redis
> sudo systemctl start redis
> sudo systemctl enable redis
"""

def test_celery_setup():
    """Test if Celery can be imported and configured"""
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
        import django
        django.setup()
        
        from celery import current_app
        print("✅ Celery is properly configured")
        
        # Test if we can import our tasks
        from apps.google_integration.tasks import trigger_auto_apply_for_user
        print("✅ Auto-apply task can be imported")
        
        return True
        
    except Exception as e:
        print(f"❌ Celery setup error: {e}")
        return False

def create_test_commands():
    """Create test commands file"""
    commands = """
@echo off
echo Testing Redis and Celery Setup
echo ================================

echo.
echo 1. Testing Redis connection...
redis-cli ping
if %errorlevel% neq 0 (
    echo ❌ Redis not responding
    echo 💡 Make sure Redis server is running
    pause
    exit /b 1
) else (
    echo ✅ Redis is working
)

echo.
echo 2. Testing Celery worker...
cd /d "%~dp0"
celery -A Backend inspect stats
if %errorlevel% neq 0 (
    echo ❌ Celery worker not running
    echo 💡 Start worker with: celery -A Backend worker --loglevel=info
) else (
    echo ✅ Celery worker is running
)

echo.
echo 3. Testing auto-apply diagnostic...
python debug_auto_apply_error.py

pause
"""
    
    with open("test_services.bat", "w") as f:
        f.write(commands)
    
    print("✅ Created test_services.bat for easy testing")

def main():
    print("🔧 REDIS AND CELERY SETUP FOR AUTO-APPLY")
    print("=" * 50)
    
    # Check Redis Python package
    redis_python_ok = check_redis_installation()
    
    if not redis_python_ok:
        # Try to install Redis Python package
        if "Redis Python package not installed" in str(redis_python_ok):
            install_redis_python_package()
            redis_python_ok = check_redis_installation()
    
    # Test Celery setup
    celery_ok = test_celery_setup()
    
    # Create test commands
    create_test_commands()
    
    print("\n" + "=" * 50)
    print("📊 SETUP STATUS")
    print("=" * 50)
    
    if not redis_python_ok:
        print("❌ Redis server is not running or accessible")
        print(get_redis_installation_instructions())
        
        print("\n🚀 AFTER INSTALLING REDIS:")
        print("1. Restart your computer (or start Redis service)")
        print("2. Run: python debug_auto_apply_error.py")
        print("3. Should see: ✅ Redis: Connected and responsive")
        
    if not celery_ok:
        print("❌ Celery configuration issues")
        print("   💡 Check Django settings and imports")
    
    if redis_python_ok and celery_ok:
        print("✅ Python packages are ready!")
        print("✅ Celery configuration is working!")
        print("\n🎯 NEXT STEPS:")
        print("1. Make sure Redis server is running")
        print("2. Start Celery worker: celery -A Backend worker --loglevel=info")
        print("3. Test auto-apply from frontend")
    
    print(f"\n📝 QUICK TEST COMMANDS:")
    print(f"   Redis check: python -c \"import redis; redis.Redis().ping(); print('Redis OK')\"")
    print(f"   Run diagnostic: python debug_auto_apply_error.py")
    print(f"   Test batch file: test_services.bat")

if __name__ == "__main__":
    main() 