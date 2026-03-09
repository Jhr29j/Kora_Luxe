from config import supabase

# Check if there are triggers on the users table
try:
    # Try a raw SQL query via rpc if available
    r = supabase.rpc('exec', {'sql': "SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users'"}).execute()
    print("Triggers found:", r.data)
except Exception as e:
    print("RPC not available, using workaround:", e)
    # Try reading triggers via pg_trigger
    try:
        r = supabase.table("pg_trigger").select("tgname").execute()
        print("pg_trigger:", r.data)
    except Exception as e2:
        print("No direct access to catalog:", e2)
