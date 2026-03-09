import os
import sys
import json
from pathlib import Path

# Add project root to sys.path to import Backend.config
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

try:
    from Backend.config import supabase
    print("✅ Supabase client imported")
except ImportError as e:
    print(f"❌ Error importing config: {e}")
    sys.exit(1)

def check_data():
    try:
        # Check Products
        res_p = supabase.table('products').select('id, nombre, imagen_url', count='exact').execute()
        count_p = res_p.count
        print(f"Products total: {count_p}")
        
        if res_p.data:
            img_lens = [len(str(p.get('imagen_url', ''))) for p in res_p.data if p.get('imagen_url')]
            if img_lens:
                avg_len = sum(img_lens) / len(img_lens)
                max_len = max(img_lens)
                print(f"Average image string length: {avg_len:,.0f} chars")
                print(f"Max image string length: {max_len:,.0f} chars")
                print(f"Total estimated image payload: {sum(img_lens)/1024/1024:,.2f} MB")
            else:
                print("No images found in products")
        
        # Check Sales
        res_s = supabase.table('sales').select('id', count='exact').execute()
        print(f"Sales total: {res_s.count}")

    except Exception as e:
        print(f"❌ Error during check: {e}")

if __name__ == "__main__":
    check_data()
