#!/usr/bin/env python3
"""
Test script to verify the scraper fixes work properly
"""

import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from fetch_michael_page_job import fetch_michael_page_job

def test_scraper():
    """Test the scraper with a small number of jobs"""
    print("🧪 Testing scraper with fixes...")
    print("=" * 50)
    
    try:
        # Test with just 5 jobs to verify it works
        fetch_michael_page_job(max_jobs=5)
        
        print("\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_scraper() 