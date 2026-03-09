import json
from config import supabase

response = supabase.table("users").select("email, password").execute()
for r in response.data:
    print(r)
