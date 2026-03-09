from config import supabase

try:
    print("Verificando tabla 'settings'...")
    res = supabase.table("settings").select("*").limit(1).execute()
    print("✅ Tabla 'settings' existe.")
except Exception as e:
    print(f"❌ Error: {e}")
    if "does not exist" in str(e).lower() or "404" in str(e).lower():
        print("La tabla 'settings' no existe en Supabase.")
