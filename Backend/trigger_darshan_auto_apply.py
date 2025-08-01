#!/usr/bin/env python
"""
Simple script to trigger auto-apply for Darshan Patel
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.google_integration.models import GoogleIntegration
from apps.google_integration.tasks import trigger_auto_apply_for_user
import time

User = get_user_model()

def trigger_auto_apply():
    """
    Trigger auto-apply for Darshan Patel
    """
    print("🚀 Triggering Auto-Apply for Darshan Patel")
    print("=" * 50)
    
    try:
        # Get Darshan Patel user
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        print(f"✅ Found user: {user.get_full_name()} ({user.email})")
        
        # Check Google integration
        integration = GoogleIntegration.objects.get(user=user)
        print(f"✅ Google Integration Status: {integration.status}")
        print(f"✅ Auto Apply Enabled: {integration.auto_apply_enabled}")
        
        if not integration.auto_apply_enabled:
            print("❌ Auto-apply is disabled for this user")
            return
        
        # Trigger the auto-apply task
        print("\n📤 Triggering auto-apply task...")
        result = trigger_auto_apply_for_user.delay(
            user.id,
            max_applications=5,  # Maximum 5 applications
            filters=None  # Use default filters from user's integration
        )
        
        print(f"✅ Auto-apply task successfully triggered!")
        print(f"   Task ID: {result.id}")
        print(f"   User: {user.email}")
        print(f"   Max Applications: 5")
        
        print("\n📋 Process Flow:")
        print("1. ✅ Task sent to Celery queue")
        print("2. 🔄 Celery worker will pick up the task")
        print("3. 🔍 System will find jobs matching user preferences")
        print("4. 📧 For each matching job at Technobits Digital:")
        print("   - Generate application email")
        print("   - Send from darshanp.technobits@gmail.com")
        print("   - Send to technobits@gmail.com") 
        print("   - Track application in database")
        
        print(f"\n⏱️  Expected completion: 1-2 minutes")
        print(f"📊 You can check the results by running check_auto_apply_status()")
        
        return result
        
    except User.DoesNotExist:
        print("❌ User darshanp.technobits@gmail.com not found")
        print("   Run setup_darshan_auto_apply.py first to create the user")
        return None
    
    except GoogleIntegration.DoesNotExist:
        print("❌ Google Integration not found for user")
        print("   Run setup_darshan_auto_apply.py first to set up Google integration")
        return None
    
    except Exception as e:
        print(f"❌ Error triggering auto-apply: {e}")
        return None

def check_status():
    """
    Check the status of auto-apply for Darshan Patel
    """
    print("\n📊 Checking Auto-Apply Status...")
    print("=" * 50)
    
    try:
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        
        # Check recent sessions
        from apps.google_integration.models import AutoApplySession
        recent_sessions = AutoApplySession.objects.filter(
            google_integration__user=user
        ).order_by('-created_at')[:3]
        
        print(f"📋 Recent Auto-Apply Sessions: {recent_sessions.count()}")
        for session in recent_sessions:
            print(f"   🔄 Session {str(session.session_id)[:8]}...")
            print(f"      Status: {session.status}")
            print(f"      Jobs Found: {session.jobs_found}")
            print(f"      Applications Sent: {session.applications_sent}")
            print(f"      Created: {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print()
        
        # Check auto-applied jobs
        from apps.applications.models import AutoAppliedJob
        auto_applications = AutoAppliedJob.objects.filter(user=user).order_by('-applied_at')
        
        print(f"📨 Total Auto-Applied Jobs: {auto_applications.count()}")
        for auto_app in auto_applications:
            print(f"   💼 {auto_app.job.title} at {auto_app.job.company.name}")
            print(f"      Email Status: {auto_app.email_status}")
            print(f"      Company Email: {auto_app.company_email}")
            print(f"      Applied At: {auto_app.applied_at.strftime('%Y-%m-%d %H:%M:%S')}")
            if auto_app.error_message:
                print(f"      Error: {auto_app.error_message}")
            print()
        
        # Check email records
        from apps.google_integration.models import EmailSentRecord
        email_records = EmailSentRecord.objects.filter(
            google_integration__user=user
        ).order_by('-sent_at')
        
        print(f"📧 Email Records: {email_records.count()}")
        for record in email_records:
            print(f"   📬 To: {record.to_email}")
            print(f"      Subject: {record.subject}")
            print(f"      Status: {record.status}")
            print(f"      Sent At: {record.sent_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print()
            
    except Exception as e:
        print(f"❌ Error checking status: {e}")

if __name__ == "__main__":
    print("🎯 Darshan Patel Auto-Apply Trigger")
    print("="*50)
    
    # First check if user exists
    try:
        user = User.objects.get(email="darshanp.technobits@gmail.com")
        print(f"✅ User found: {user.get_full_name()}")
    except User.DoesNotExist:
        print("❌ User not found. Please run setup_darshan_auto_apply.py first")
        exit(1)
    
    print("\nOptions:")
    print("1. Trigger auto-apply")
    print("2. Check status")
    print("3. Both")
    
    choice = input("\nEnter your choice (1/2/3): ")
    
    if choice == "1":
        trigger_auto_apply()
    elif choice == "2":
        check_status()
    elif choice == "3":
        result = trigger_auto_apply()
        if result:
            print("\n⏱️  Waiting 10 seconds for processing...")
            time.sleep(10)
            check_status()
    else:
        print("Invalid choice") 