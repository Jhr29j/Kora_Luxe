import os
import json
import urllib.request
from dotenv import load_dotenv
from pathlib import Path

env_path = Path('Backend') / '.env'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Missing SUPABASE_URL or KEY in .env")
    exit(1)

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "count=exact"
}

def get_count(table):
    api_url = f"{url}/rest/v1/{table}?select=id&limit=1"
    try:
        req = urllib.request.Request(api_url, headers=headers, method='GET')
        with urllib.request.urlopen(req) as response:
            count = response.getheader('Content-Range')
            if count:
                return count.split('/')[-1]
            return "unknown"
    except Exception as e:
        return f"error: {e}"

print(f"Products Count: {get_count('products')}")
print(f"Sales Count: {get_count('sales')}")
