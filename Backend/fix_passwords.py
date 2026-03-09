from config import supabase

print("Actualizando contraseñas a texto plano...")

# 1. Update admin
supabase.table("users").update({"password": "admin"}).eq("email", "adminkoraluxe@gmail.com").execute()

# 2. Update vendedor1
supabase.table("users").update({"password": "Vendedor123"}).eq("email", "vendedor1@koraluxe.com").execute()

# 3. Update meyvers12
supabase.table("users").update({"password": "123"}).eq("email", "meyvers12@gmail.com").execute()

print("¡Contraseñas actualizadas!")
