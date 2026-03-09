import json
from config import supabase

response = supabase.table("users").select("id, nombre, email, rol").execute()
with open('users_json.txt', 'w', encoding='utf-8') as f:
    json.dump(response.data, f, indent=2)
