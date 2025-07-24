#!/usr/bin/env python3
"""
Test script to verify pagination is working correctly
"""

import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from django.test import Client

def test_pagination():
    """Test that pagination returns exactly 9 jobs per page"""
    client = Client()
    
    print("🧪 Testing pagination...")
    print("=" * 50)
    
    # Test first page with page_size=9
    url = '/api/v1/jobs/jobs/?page=1&page_size=9'
    print(f"Testing URL: {url}")
    
    response = client.get(url)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total count: {data.get('count', 'N/A')}")
        print(f"Results length: {len(data.get('results', []))}")
        print(f"Next page: {data.get('next', 'N/A')}")
        print(f"Previous page: {data.get('previous', 'N/A')}")
        
        # Check if we got exactly 9 jobs
        results_count = len(data.get('results', []))
        if results_count == 9:
            print("✅ SUCCESS: Got exactly 9 jobs on first page!")
        else:
            print(f"❌ FAILED: Expected 9 jobs, got {results_count}")
        
        # Show the jobs
        print("\nJobs returned:")
        for i, job in enumerate(data.get('results', [])):
            print(f"  {i+1}. {job['title']} (ID: {job['id']})")
            
        # Test second page if there are more jobs
        if data.get('next'):
            print(f"\n🔍 Testing second page...")
            next_url = data['next'].replace('http://testserver', '')
            response2 = client.get(next_url)
            
            if response2.status_code == 200:
                data2 = response2.json()
                results_count2 = len(data2.get('results', []))
                print(f"Second page results: {results_count2} jobs")
                
                if results_count2 <= 9:
                    print("✅ SUCCESS: Second page has correct number of jobs!")
                else:
                    print(f"❌ FAILED: Second page has too many jobs: {results_count2}")
            else:
                print(f"❌ FAILED: Second page request failed: {response2.status_code}")
        
    else:
        print(f"❌ FAILED: Request failed with status {response.status_code}")
        print(f"Response: {response.content}")

if __name__ == "__main__":
    test_pagination() 