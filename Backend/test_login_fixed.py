import requests
import json

def test_login_fixed():
    """Test the login endpoint with correct data format"""
    url = "http://127.0.0.1:8000/api/v1/auth/login/"
    
    # Test data in the correct format (object with email and password)
    test_data = {
        "email": "test@evoljobs.com",
        "password": "testpass123"
    }
    
    try:
        print(f"🔍 Testing login endpoint with correct format: {url}")
        print(f"📤 Sending data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(url, json=test_data)
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ Login successful!")
            try:
                success_data = response.json()
                print("✅ Response format is correct")
                print(f"   User: {success_data.get('user', {}).get('email', 'N/A')}")
                print(f"   Has tokens: {'tokens' in success_data}")
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
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login_fixed() 