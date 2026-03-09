from config import supabase

try:
    print("--- Listando todos los usuarios ---")
    res = supabase.table("users").select("id, nombre, email, password").execute()
    data = res.data
    
    for u in data:
        email = u.get("email")
        pwd = u.get("password")
        print(f"User: [{email}] | Pwd: [{pwd}] | Len: {len(str(pwd))}")
        if email == "adminkoraluxe@gmail.com":
            print(f"  -> MATCH FOUND for {email}")

except Exception as e:
    print(f"Error: {type(e).__name__} - {e}")
