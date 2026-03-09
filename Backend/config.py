import os
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

print(f"📁 Cargando .env desde: {env_path}")
print(f"URL encontrada: {'✅' if os.getenv('SUPABASE_URL') else '❌'}")
print(f"KEY encontrada: {'✅' if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else '❌'}")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise Exception("❌ No se encontraron SUPABASE_URL o SUPABASE_KEY en el .env")

supabase = create_client(url, key)
print("✅ Conexión exitosa a Supabase")

def query_with_retry(fn, retries=3, delay=1.5):
    """
    Ejecuta una consulta a Supabase con reintentos automáticos.
    Uso: query_with_retry(lambda: supabase.table("x").select("*").execute())
    """
    last_error = None
    for attempt in range(retries):
        try:
            return fn()
        except Exception as e:
            last_error = e
            print(f"⚠️ Intento {attempt + 1} fallido: {e}")
            if attempt < retries - 1:
                time.sleep(delay)
    raise last_error