import os
from config import supabase

try:
    email = "adminkoraluxe@gmail.com"
    print(f"--- Buscando usuario: {email} ---")
    response = supabase.table("users").select("id, nombre, email, rol, password").eq("email", email).execute()
    users = response.data

    if not users:
        print("❌ Usuario no encontrado")
    else:
        user = users[0]
        db_email = user.get('email', 'N/A')
        db_password = user.get('password', 'N/A')
        
        print(f"ID: {user['id']}")
        print(f"Email en DB: '{db_email}' (Length: {len(db_email)})")
        print(f"Password en DB: '{db_password}' (Length: {len(db_password)})")
        
        if db_password:
            print(f"Empieza con $2: {db_password.startswith('$2')}")
            print(f"Es 'admin': {db_password == 'admin'}")
            print(f"Contiene espacios al inicio/fin: {db_password != db_password.strip()}")

except Exception as e:
    print(f"❌ Error: {e}")
