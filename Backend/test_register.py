import requests
import json

def test_register_endpoint():
    """Test the registration endpoint to create a test user"""
    url = "http://127.0.0.1:8000/api/v1/auth/register/"
    
    # Test registration data
    test_data = {
        "email": "test@evoljobs.com",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "first_name": "Test",
        "last_name": "User",
        "user_type": "job_seeker"
    }
    
    try:
        print(f"🔍 Testing registration endpoint: {url}")
        print(f"📤 Sending data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(url, json=test_data)
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 201:
            print(f"✅ Registration successful!")
            try:
                success_data = response.json()
                print(json.dumps(success_data, indent=2))
            except:
                print(f"Raw response: {response.text}")
        elif response.status_code == 400:
            print(f"❌ Bad Request - Response body:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(f"Raw response: {response.text}")
        else:
            print(f"⚠️ Unexpected status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server is not running")
        print("💡 Start the backend with: python manage.py runserver")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_register_endpoint() 