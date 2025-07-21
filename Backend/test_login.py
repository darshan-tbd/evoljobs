import requests
import json

try:
    response = requests.post('http://localhost:8000/api/v1/auth/login/', json={
        'email': 'admin1@gmail.com',
        'password': 'admin1'
    })
    
    print(f'Status Code: {response.status_code}')
    
    if response.status_code == 200:
        print('✅ Login successful!')
        print('Response:', json.dumps(response.json(), indent=2))
    else:
        print('❌ Login failed!')
        print('Response:', response.text)
        
except Exception as e:
    print(f'Error: {e}') 