#!/usr/bin/env python
"""
Test script to verify subscription upgrade functionality
"""
import os
import sys
import django
from datetime import datetime

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.subscriptions.models import SubscriptionPlan, UserSubscription
from apps.subscriptions.services import SubscriptionService

User = get_user_model()

def test_subscription_upgrade():
    """Test the subscription upgrade functionality"""
    print("=== Testing Subscription Upgrade Functionality ===\n")
    
    # Get or create a test user
    try:
        user = User.objects.get(email='test@example.com')
        print(f"Using existing test user: {user.email}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        print(f"Created new test user: {user.email}")
    
    # Check current subscription status
    print(f"\n1. Current subscription status:")
    status = SubscriptionService.get_subscription_status(user)
    print(f"   - Has active subscription: {status['has_active_subscription']}")
    print(f"   - Current plan: {status['plan_name']} ({status['plan_type']})")
    print(f"   - Daily limit: {status['daily_limit']}")
    print(f"   - Price: ${status['price']}")
    
    # Get available plans
    print(f"\n2. Available plans:")
    plans = SubscriptionService.get_available_plans()
    for plan in plans:
        print(f"   - {plan.name} ({plan.plan_type}): ${plan.price}/month, {plan.daily_application_limit} apps/day")
    
    # Test upgrading to Standard plan
    try:
        standard_plan = SubscriptionPlan.objects.get(plan_type='standard', is_active=True)
        print(f"\n3. Testing upgrade to {standard_plan.name}:")
        
        # Create subscription
        subscription = SubscriptionService.create_subscription(
            user=user,
            plan=standard_plan
        )
        print(f"   - Subscription created: {subscription.id}")
        print(f"   - Start date: {subscription.start_date}")
        print(f"   - End date: {subscription.end_date}")
        print(f"   - Status: {subscription.status}")
        print(f"   - Auto renew: {subscription.auto_renew}")
        
        # Check updated status
        print(f"\n4. Updated subscription status:")
        updated_status = SubscriptionService.get_subscription_status(user)
        print(f"   - Has active subscription: {updated_status['has_active_subscription']}")
        print(f"   - Current plan: {updated_status['plan_name']} ({updated_status['plan_type']})")
        print(f"   - Daily limit: {updated_status['daily_limit']}")
        print(f"   - Price: ${updated_status['price']}")
        print(f"   - Days remaining: {updated_status['days_remaining']}")
        
        print(f"\n✅ Subscription upgrade test PASSED!")
        
    except SubscriptionPlan.DoesNotExist:
        print(f"\n❌ Standard plan not found. Creating one...")
        
        # Create Standard plan if it doesn't exist
        standard_plan = SubscriptionPlan.objects.create(
            name='Standard Plan',
            description='Enhanced plan with more daily applications',
            price=9.99,
            duration_days=30,
            plan_type='standard',
            daily_application_limit=10,
            features=[
                'Enhanced job search',
                '10 applications per day',
                'Priority support',
                'Advanced job matching'
            ]
        )
        print(f"   - Created Standard plan: {standard_plan.name}")
        
        # Now test the upgrade
        subscription = SubscriptionService.create_subscription(
            user=user,
            plan=standard_plan
        )
        print(f"   - Subscription created: {subscription.id}")
        print(f"✅ Subscription upgrade test PASSED!")
    
    except Exception as e:
        print(f"\n❌ Subscription upgrade test FAILED: {str(e)}")
        return False
    
    return True

def cleanup_test_data():
    """Clean up test data"""
    print(f"\n=== Cleaning up test data ===")
    
    try:
        # Delete test user subscriptions
        user = User.objects.get(email='test@example.com')
        subscriptions = UserSubscription.objects.filter(user=user)
        print(f"   - Deleting {subscriptions.count()} test subscriptions")
        subscriptions.delete()
        
        # Delete test user
        user.delete()
        print(f"   - Deleted test user")
        
        print(f"✅ Cleanup completed!")
        
    except User.DoesNotExist:
        print(f"   - No test user found to clean up")
    except Exception as e:
        print(f"❌ Cleanup failed: {str(e)}")

if __name__ == '__main__':
    print("Starting subscription upgrade test...\n")
    
    try:
        success = test_subscription_upgrade()
        
        if success:
            print(f"\n🎉 All tests passed! The subscription system is working correctly.")
        else:
            print(f"\n💥 Tests failed! Please check the implementation.")
            
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
    
    # Uncomment the line below to clean up test data
    # cleanup_test_data() 