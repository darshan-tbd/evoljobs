import requests
import json

def test_jobs_with_auth():
    """Test the jobs endpoint with authentication"""
    
    # First, login to get access token
    login_url = "http://127.0.0.1:8000/api/v1/auth/login/"
    login_data = {
        "email": "test@evoljobs.com",
        "password": "testpass123"
    }
    
    try:
        print("🔐 Logging in to get access token...")
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            access_token = login_result['tokens']['access']
            print("✅ Login successful, got access token")
            
            # Now test jobs API with authentication
            jobs_url = "http://127.0.0.1:8000/api/v1/jobs/"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            print(f"🔍 Testing jobs endpoint with auth: {jobs_url}")
            jobs_response = requests.get(jobs_url, headers=headers)
            
            print(f"📥 Response status: {jobs_response.status_code}")
            
            if jobs_response.status_code == 200:
                print(f"✅ Jobs API working with auth!")
                try:
                    jobs_data = jobs_response.json()
                    print(f"📊 Found {jobs_data.get('count', 0)} jobs")
                    if jobs_data.get('results'):
                        print("📋 Sample jobs:")
                        for i, job in enumerate(jobs_data['results'][:3]):
                            print(f"   {i+1}. {job.get('title', 'No title')} at {job.get('company', {}).get('name', 'Unknown company')}")
                    else:
                        print("📝 No jobs found - you may need to run the scraper")
                except:
                    print(f"Raw response: {jobs_response.text}")
            else:
                print(f"❌ Jobs API error - Response: {jobs_response.text}")
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server is not running")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_jobs_with_auth() 