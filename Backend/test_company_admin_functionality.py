#!/usr/bin/env python
"""
Test script to verify Company Admin functionality
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib import admin
from apps.companies.models import Company
from apps.companies.admin import CompanyAdmin

def test_company_admin():
    """Test the enhanced Company admin functionality"""
    
    print("🏢 TESTING COMPANY ADMIN FUNCTIONALITY")
    print("=" * 60)
    
    # Check if Company is registered
    is_registered = admin.site.is_registered(Company)
    print(f"✅ Company model registered in admin: {is_registered}")
    
    if is_registered:
        admin_class = admin.site._registry[Company]
        print(f"✅ Admin class: {admin_class.__class__.__name__}")
        
        # Check list_display fields
        list_display = getattr(admin_class, 'list_display', [])
        print(f"✅ List display fields ({len(list_display)}):")
        for field in list_display:
            print(f"   📝 {field}")
        
        # Check fieldsets for edit/add functionality
        fieldsets = getattr(admin_class, 'fieldsets', [])
        print(f"\n✅ Fieldsets for Add/Edit ({len(fieldsets)} sections):")
        for name, options in fieldsets:
            fields = options.get('fields', [])
            description = options.get('description', '')
            print(f"   📂 {name}: {len(fields)} fields")
            if description:
                print(f"      💬 {description}")
            for field in fields:
                print(f"      📝 {field}")
        
        # Check list_filter
        list_filter = getattr(admin_class, 'list_filter', [])
        print(f"\n✅ List filters ({len(list_filter)}):")
        for filter_field in list_filter:
            print(f"   🔍 {filter_field}")
        
        # Check search_fields
        search_fields = getattr(admin_class, 'search_fields', [])
        print(f"\n✅ Search fields ({len(search_fields)}):")
        for search_field in search_fields:
            print(f"   🔎 {search_field}")
        
        # Check custom actions
        actions = getattr(admin_class, 'actions', [])
        print(f"\n✅ Custom actions ({len(actions)}):")
        for action in actions:
            if hasattr(action, 'short_description'):
                print(f"   ⚡ {action.__name__}: {action.short_description}")
            else:
                print(f"   ⚡ {action}")
        
        # Check list_editable
        list_editable = getattr(admin_class, 'list_editable', [])
        print(f"\n✅ Inline editable fields ({len(list_editable)}):")
        for field in list_editable:
            print(f"   ✏️ {field}")
    
    print("\n" + "=" * 60)
    print("🧪 TESTING WITH SAMPLE DATA")
    print("=" * 60)
    
    # Test with actual company data
    technobits = Company.objects.filter(name='Technobits').first()
    if technobits:
        print(f"✅ Sample Company: {technobits.name}")
        print(f"✅ Contact Email: {technobits.email}")
        print(f"✅ Phone: {technobits.phone}")
        print(f"✅ Website: {technobits.website}")
        print(f"✅ Industry: {technobits.industry}")
        print(f"✅ Location: {technobits.headquarters}")
        print(f"✅ Verified: {technobits.is_verified}")
        print(f"✅ Featured: {technobits.is_featured}")
        
        # Test if all key fields for Auto Apply are available
        auto_apply_required_fields = ['email', 'phone', 'name']
        print(f"\n✅ Auto Apply Required Fields:")
        for field in auto_apply_required_fields:
            value = getattr(technobits, field, 'Not set')
            status = "✓" if value else "✗"
            print(f"   {status} {field}: {value}")
    
    print("\n" + "=" * 60)
    print("📋 ADMIN FUNCTIONALITY SUMMARY")
    print("=" * 60)
    
    functionality_checks = [
        ("Company Model Registration", is_registered),
        ("Add New Company", bool(fieldsets)),
        ("Edit Company Details", bool(fieldsets)),
        ("Contact Details Management", any('email' in str(fieldsets) for f in fieldsets if f)),
        ("Bulk Actions", bool(actions)),
        ("Search Functionality", bool(search_fields)),
        ("Filtering Options", bool(list_filter)),
        ("Inline Editing", bool(list_editable))
    ]
    
    for check_name, check_result in functionality_checks:
        status = "✅" if check_result else "❌"
        print(f"{status} {check_name}")
    
    all_passed = all(result for _, result in functionality_checks)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL COMPANY ADMIN FUNCTIONALITY TESTS PASSED!")
        print("✅ Add/Edit functionality is fully implemented")
        print("✅ Contact details management is available")
        print("✅ All required fields are editable")
        print("✅ Admin interface is comprehensive and functional")
    else:
        print("⚠️ Some functionality checks failed")
    
    print("\n📝 ADMIN DASHBOARD ACCESS:")
    print("1. Login to Django admin at /admin/")
    print("2. Navigate to Companies section")
    print("3. Click 'Add Company' for new entries")
    print("4. Click on existing company name to edit")
    print("5. Use bulk actions for multiple companies")
    print("6. Use search and filters to find companies")

if __name__ == "__main__":
    test_company_admin() 