from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import os

# ===============================
# Cargar .env
# ===============================
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # 🔥 IMPORTANTE

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ===============================
# Datos del nuevo usuario
# ===============================
nombre = "Vendedor 1"
email = "vendedor1@koraluxe.com"
password = "Vendedor123"   # texto plano (se hashea en SQL)
rol = "vendedor"

# ===============================
# Insertar usuario en BD (TEXTO PLANO)
# ===============================
data = {
    "nombre": nombre,
    "email": email,
    "password": password,
    "rol": rol,
    "activo": True
}

try:
    response = supabase.table("users").insert(data).execute()
    print("✅ Usuario creado correctamente:", response.data[0]['email'])
except Exception as e:
    print("❌ Error al crear usuario:", str(e))