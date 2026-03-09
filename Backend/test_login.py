import requests

response = requests.post('http://localhost:5000/api/login', json={
    'email': 'adminkoraluxe@gmail.com',
    'password': 'admin' # Assuming this is a test password, or we can just see the DB error
})

print(response.status_code)
print(response.json())
