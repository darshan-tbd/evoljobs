import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.test import Client

def test_frontend_default_call():
    """Test the exact API call that frontend makes by default"""
    client = Client()
    
    # This simulates the default frontend call with default filters
    url = '/api/v1/jobs/jobs/?exclude_expired=true&ordering=-created_at&page=1'
    
    print(f"Testing URL: {url}")
    response = client.get(url)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        print(f"Total count: {data.get('count', 'N/A')}")
        print(f"Results length: {len(data.get('results', []))}")
        print(f"Next page: {data.get('next', 'N/A')}")
        print(f"Previous page: {data.get('previous', 'N/A')}")
        
        print("\nJobs returned:")
        for i, job in enumerate(data.get('results', [])):
            print(f"  {i+1}. {job['title']} (ID: {job['id']})")
            
        # Check if pagination is causing the issue
        if 'next' in data and data['next']:
            print(f"\nWARNING: There are more pages! Next URL: {data['next']}")
    else:
        print(f"Error: {response.status_code}")
        print(f"Response: {response.content}")

def test_no_filters():
    """Test with no filters at all"""
    client = Client()
    
    url = '/api/v1/jobs/jobs/'
    print(f"\nTesting URL with no filters: {url}")
    response = client.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total count: {data.get('count', 'N/A')}")
        print(f"Results length: {len(data.get('results', []))}")

if __name__ == "__main__":
    test_frontend_default_call()
    test_no_filters() 