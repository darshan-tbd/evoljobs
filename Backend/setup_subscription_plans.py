#!/usr/bin/env python
"""
Script to set up default subscription plans
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.subscriptions.models import SubscriptionPlan

def setup_default_plans():
    """Set up default subscription plans"""
    print("Setting up default subscription plans...\n")
    
    plans_data = [
        {
            'name': 'Free Plan',
            'description': 'Basic plan with limited applications',
            'price': 0.00,
            'duration_days': 30,
            'plan_type': 'free',
            'daily_application_limit': 5,
            'features': [
                'Basic job search',
                '5 applications per day',
                'Standard support',
                'Job recommendations'
            ],
            'priority_support': False,
            'advanced_analytics': False,
            'custom_branding': False,
            'api_access': False
        },
        {
            'name': 'Standard Plan',
            'description': 'Enhanced plan with more daily applications',
            'price': 9.99,
            'duration_days': 30,
            'plan_type': 'standard',
            'daily_application_limit': 10,
            'features': [
                'Enhanced job search',
                '10 applications per day',
                'Priority support',
                'Advanced job matching',
                'Email notifications'
            ],
            'priority_support': True,
            'advanced_analytics': False,
            'custom_branding': False,
            'api_access': False
        },
        {
            'name': 'Premium Plan',
            'description': 'Premium plan with advanced features',
            'price': 19.99,
            'duration_days': 30,
            'plan_type': 'premium',
            'daily_application_limit': 25,
            'features': [
                'Premium job search',
                '25 applications per day',
                'Priority support',
                'Advanced analytics',
                'Custom branding',
                'API access',
                'Dedicated account manager'
            ],
            'priority_support': True,
            'advanced_analytics': True,
            'custom_branding': True,
            'api_access': True
        },
        {
            'name': 'Enterprise Plan',
            'description': 'Enterprise plan for large organizations',
            'price': 49.99,
            'duration_days': 30,
            'plan_type': 'enterprise',
            'daily_application_limit': 100,
            'features': [
                'Unlimited job search',
                '100 applications per day',
                '24/7 priority support',
                'Advanced analytics dashboard',
                'Custom branding',
                'Full API access',
                'Dedicated account manager',
                'Custom integrations',
                'White-label solution'
            ],
            'priority_support': True,
            'advanced_analytics': True,
            'custom_branding': True,
            'api_access': True
        }
    ]
    
    created_count = 0
    updated_count = 0
    
    for plan_data in plans_data:
        plan_type = plan_data['plan_type']
        
        try:
            plan = SubscriptionPlan.objects.get(plan_type=plan_type)
            # Update existing plan
            for key, value in plan_data.items():
                setattr(plan, key, value)
            plan.save()
            updated_count += 1
            print(f"✅ Updated {plan.name}")
        except SubscriptionPlan.DoesNotExist:
            # Create new plan
            plan = SubscriptionPlan.objects.create(**plan_data)
            created_count += 1
            print(f"✅ Created {plan.name}")
    
    print(f"\nSummary:")
    print(f"  - Created: {created_count} plans")
    print(f"  - Updated: {updated_count} plans")
    print(f"  - Total: {created_count + updated_count} plans")
    
    # Display all plans
    print(f"\nCurrent subscription plans:")
    all_plans = SubscriptionPlan.objects.filter(is_active=True).order_by('price')
    for plan in all_plans:
        print(f"  - {plan.name} ({plan.plan_type}): ${plan.price}/month, {plan.daily_application_limit} apps/day")

if __name__ == '__main__':
    setup_default_plans() 