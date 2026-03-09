import urllib.request
import json
import time

endpoints = [
    "http://localhost:5000/",
    "http://localhost:5000/api/dashboard",
    "http://localhost:5000/api/productos?include_images=false",
    "http://localhost:5000/api/reporte-diario"
]

for url in endpoints:
    print(f"Testing {url}...")
    start = time.time()
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = response.read()
            print(f"  ✅ Status: {response.status}")
            print(f"  ✅ Size: {len(data)} bytes")
            print(f"  ✅ Time: {time.time() - start:.2f}s")
            if len(data) < 1000:
                print(f"  ✅ Content: {data.decode('utf-8')}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
    print("-" * 20)
