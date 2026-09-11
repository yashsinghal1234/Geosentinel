"""
Quick test script to send a single sample HTTP request to the /api/ingest endpoint.
"""
import requests
import json
from datetime import datetime

url = "http://localhost:8000/api/ingest"
headers = {
    "Content-Type": "application/json",
    "X-Gateway-Key": "geosentinel_gw_secret_key"
}

payload = {
    "node_id": "N-01",
    "gateway_id": "GW-01",
    "tilt": 2.45,
    "vibration": 0.85,
    "gas_level": 18.2,
    "crack_width": 3.10,
    "rainfall": 5.0,
    "battery": 95.0,
    "rssi": -65,
    "latitude": 23.7512,
    "longitude": 86.4215,
    "timestamp": datetime.utcnow().isoformat()
}

print(f"Sending HTTP POST to {url} ...")
print(json.dumps(payload, indent=2))

try:
    response = requests.post(url, json=payload, headers=headers, timeout=5)
    print(f"\nResponse Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
