import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Add Backend to path to import config if needed, or just replicate
backend_path = Path(__file__).parent.parent / 'Backend'
env_path = backend_path / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ No se encontraron SUPABASE_URL o SUPABASE_KEY")
    sys.exit(1)

supabase = create_client(url, key)

try:
    print("--- Verificando Tabla PRODUCTS ---")
    res = supabase.table("products").select("*").limit(5).execute()
    if res.data:
        print(f"Encontrados {len(res.data)} productos.")
        for i, p in enumerate(res.data):
            print(f"\nProducto {i+1}: {p.get('nombre')}")
            # List all keys to see column names
            print(f"Columnas disponibles: {list(p.keys())}")
            print(f"imagen_url: {p.get('imagen_url')}")
    else:
        print("No se encontraron productos.")
except Exception as e:
    print(f"Error: {e}")
