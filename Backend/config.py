import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# 🔥 ESTA ES LA LÍNEA MÁGICA - Busca .env en el mismo directorio que este archivo
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Opcional: Verificar que se cargó
print(f"📁 Cargando .env desde: {env_path}")
print(f"URL encontrada: {'✅' if os.getenv('SUPABASE_URL') else '❌'}")
print(f"KEY encontrada: {'✅' if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else '❌'}")

# Resto de tu código igual
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise Exception("❌ No se encontraron SUPABASE_URL o SUPABASE_KEY en el .env")

supabase = create_client(url, key)
print("✅ Conexión exitosa a Supabase")