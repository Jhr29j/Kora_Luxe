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
# Insertar usuario (HASH EN BD)
# ===============================
query = """
insert into users (nombre, email, password, rol)
values (%s, %s, crypt(%s, gen_salt('bf')), %s)
"""

supabase.postgrest.rpc(
    "execute_sql",
    {
        "query": query,
        "params": [nombre, email, password, rol]
    }
)

print("✅ Usuario creado correctamente")