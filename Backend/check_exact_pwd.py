from config import supabase

response = supabase.table("users").select("email, password").eq("email", "adminkoraluxe@gmail.com").execute()
if response.data:
    pwd = response.data[0]['password']
    print(f"Email: {response.data[0]['email']}")
    print(f"Password exact value: '{pwd}'")
    print(f"Is 'admin': {pwd == 'admin'}")
    print(f"Length: {len(pwd)}")
    print(f"Starts with $2: {pwd.startswith('$2')}")
