from config import supabase

response = supabase.table("productos").select("*").execute()
print(len(response.data))
