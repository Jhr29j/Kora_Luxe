import os
import json
import urllib.request
from dotenv import load_dotenv
from pathlib import Path

# Load env directly
env_path = Path('Backend') / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Missing SUPABASE_URL or KEY in .env")
    exit(1)

api_url = f"{url}/rest/v1/products?select=id,nombre,imagen_url"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

try:
    print(f"Checking {api_url}...")
    req = urllib.request.Request(api_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        if response.status == 200:
            res_data = response.read().decode('utf-8')
            data = json.loads(res_data)
            print(f"Total products: {len(data)}")
            if data:
                total_size_chars = sum(len(str(p.get('imagen_url', ''))) for p in data)
                avg_size_kb = (total_size_chars / len(data)) / 1024
                print(f"Total image payload: {total_size_chars / 1024 / 1024:.2f} MB")
                print(f"Average image size: {avg_size_kb:.2f} KB")
                
                # Find the largest one
                max_p = max(data, key=lambda x: len(str(x.get('imagen_url', ''))))
                print(f"Largest image ID {max_p['id']} ({max_p['nombre']}): {len(str(max_p['imagen_url']))/1024:.2f} KB")
        else:
            print(f"Error: {response.status}")
except Exception as e:
    print(f"Error: {e}")
