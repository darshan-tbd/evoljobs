#!/usr/bin/env python
"""
Test script to check API endpoints
"""
import requests
import json

def test_api_endpoints():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    # Test applications endpoint
    print("=== Testing Applications API ===")
    try:
        response = requests.get(f"{base_url}/applications/applications/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total applications: {len(data.get('results', []))}")
            if data.get('results'):
                app = data['results'][0]
                print(f"Sample application:")
                print(f"  ID: {app.get('id')}")
                print(f"  Job Title: {app.get('job_title')}")
                print(f"  Company: {app.get('job_company_name')}")
                print(f"  Status: {app.get('status')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing applications API: {e}")
    
    print("\n=== Testing Saved Jobs API ===")
    try:
        response = requests.get(f"{base_url}/jobs/saved-jobs/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total saved jobs: {len(data.get('results', []))}")
            if data.get('results'):
                saved_job = data['results'][0]
                print(f"Sample saved job:")
                print(f"  ID: {saved_job.get('id')}")
                job_data = saved_job.get('job', {})
                print(f"  Job Title: {job_data.get('title')}")
                print(f"  Company: {job_data.get('company', {}).get('name')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error testing saved jobs API: {e}")

if __name__ == "__main__":
    test_api_endpoints() 