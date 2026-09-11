"""
GeoSentinel - Edge Gateway HTTP Telemetry Transmitter Simulator
Demonstrates how physical Gateway appliances (e.g., Raspberry Pi, ESP32-S3 gateway, Linux Edge gateway)
send real-time telemetry, store-and-forward batch packet flushes, and gateway health heartbeats
over HTTP POST requests to the FastAPI backend.
"""

import asyncio
import httpx
import random
import time
from datetime import datetime

BACKEND_URL = "http://localhost:8000"
GATEWAY_ID = "GW-01"
GATEWAY_MAC = "E4:5F:01:9A:82:1C"
GATEWAY_API_KEY = "geosentinel_gw_secret_key"

HEADERS = {
    "Content-Type": "application/json",
    "X-Gateway-Key": GATEWAY_API_KEY
}

NODES = [
    {"id": "N-01", "name": "North Slope Extensometer", "lat": 23.7512, "lng": 86.4215},
    {"id": "N-02", "name": "East Highwall Inclinometer", "lat": 23.7490, "lng": 86.4250},
    {"id": "N-03", "name": "South Tailings Piezometer", "lat": 23.7460, "lng": 86.4180},
    {"id": "N-04", "name": "West Bench Seismometer", "lat": 23.7480, "lng": 86.4140},
]

# Simulated local state on the Edge Gateway
gateway_state = {
    "battery_pct": 94.0,
    "solar_watts": 4.8,
    "gsm_bars": 4,
    "cpu_temp_c": 41.5,
    "ram_usage_pct": 32.0,
    "internet_connected": True,
    "local_siren_active": False,
    "buffer_queue": []
}

async def send_single_reading_http(client: httpx.AsyncClient, node: dict):
    """Sends a single live node telemetry packet via HTTP POST /api/ingest."""
    payload = {
        "node_id": node["id"],
        "gateway_id": GATEWAY_ID,
        "tilt": round(random.uniform(0.5, 4.5), 2),
        "vibration": round(random.uniform(0.1, 1.8), 2),
        "gas_level": round(random.uniform(5.0, 45.0), 1),
        "crack_width": round(random.uniform(0.5, 6.0), 2),
        "rainfall": round(random.uniform(0.0, 15.0), 1),
        "battery": round(random.uniform(85.0, 99.0), 1),
        "rssi": random.randint(-85, -55),
        "latitude": node["lat"],
        "longitude": node["lng"],
        "timestamp": datetime.utcnow().isoformat()
    }
    
    url = f"{BACKEND_URL}/api/ingest"
    try:
        resp = await client.post(url, json=payload, headers=HEADERS, timeout=5.0)
        print(f"[HTTP POST -> {url}] Node: {node['id']} | Status: {resp.status_code} | Result: {resp.json().get('results', [{}])[0] if resp.status_code == 200 else resp.text}")
    except Exception as e:
        print(f"[ERROR] Failed to send single reading for {node['id']}: {e}")
        # When offline or connection drops, buffer on edge
        gateway_state["buffer_queue"].append(payload)
        print(f"  -> Packet stored in edge buffer. Total buffered: {len(gateway_state['buffer_queue'])}")

async def send_store_and_forward_sync_http(client: httpx.AsyncClient):
    """Flushes buffered backlog packets to Cloud via HTTP POST /api/gateway/sync."""
    if not gateway_state["buffer_queue"]:
        return

    packets_to_sync = list(gateway_state["buffer_queue"])
    payload = {
        "gateway_id": GATEWAY_ID,
        "gateway_mac": GATEWAY_MAC,
        "gateway_telemetry": {
            "gateway_id": GATEWAY_ID,
            "battery_pct": gateway_state["battery_pct"],
            "solar_watts": gateway_state["solar_watts"],
            "gsm_bars": gateway_state["gsm_bars"],
            "cpu_temp_c": gateway_state["cpu_temp_c"],
            "ram_usage_pct": gateway_state["ram_usage_pct"],
            "internet_connected": gateway_state["internet_connected"],
            "local_siren_active": gateway_state["local_siren_active"],
            "store_and_forward_buffer_count": len(packets_to_sync)
        },
        "packets": packets_to_sync
    }

    url = f"{BACKEND_URL}/api/gateway/sync"
    try:
        resp = await client.post(url, json=payload, headers=HEADERS, timeout=10.0)
        if resp.status_code == 200:
            print(f"[HTTP STORE-AND-FORWARD SYNC] Successfully synced {len(packets_to_sync)} buffered packets!")
            gateway_state["buffer_queue"] = []
        else:
            print(f"[SYNC FAILED] Status: {resp.status_code} | {resp.text}")
    except Exception as e:
        print(f"[SYNC ERROR] Could not sync buffer: {e}")

async def send_gateway_heartbeat_http(client: httpx.AsyncClient):
    """Sends Edge Appliance health metrics to HTTP POST /api/gateway/telemetry."""
    # Slight jitter for realistic simulation
    gateway_state["battery_pct"] = max(20.0, min(100.0, gateway_state["battery_pct"] + random.uniform(-0.2, 0.1)))
    gateway_state["solar_watts"] = max(0.0, min(18.0, gateway_state["solar_watts"] + random.uniform(-0.5, 0.5)))
    gateway_state["cpu_temp_c"] = round(40.0 + random.uniform(0.0, 5.0), 1)

    payload = {
        "gateway_id": GATEWAY_ID,
        "mac": GATEWAY_MAC,
        "battery_pct": gateway_state["battery_pct"],
        "solar_watts": gateway_state["solar_watts"],
        "gsm_bars": gateway_state["gsm_bars"],
        "cpu_temp_c": gateway_state["cpu_temp_c"],
        "ram_usage_pct": gateway_state["ram_usage_pct"],
        "internet_connected": gateway_state["internet_connected"],
        "wifi_hotspot_ssid": "GeoSentinel-RescueNet-AP",
        "local_siren_active": gateway_state["local_siren_active"],
        "store_and_forward_buffer_count": len(gateway_state["buffer_queue"])
    }

    url = f"{BACKEND_URL}/api/gateway/telemetry"
    try:
        resp = await client.post(url, json=payload, headers=HEADERS, timeout=5.0)
        print(f"[GATEWAY HEARTBEAT] Sent appliance metrics: Batt={payload['battery_pct']:.1f}% Solar={payload['solar_watts']:.1f}W CPU={payload['cpu_temp_c']}°C | HTTP {resp.status_code}")
    except Exception as e:
        print(f"[HEARTBEAT ERROR] {e}")

async def run_gateway_loop():
    print("=" * 70)
    print("🚀 GeoSentinel Gateway HTTP Transmitter Simulator")
    print(f"Target Backend: {BACKEND_URL}")
    print(f"Gateway ID:     {GATEWAY_ID} (MAC: {GATEWAY_MAC})")
    print(f"Header Key:     X-Gateway-Key: {GATEWAY_API_KEY}")
    print("=" * 70)

    async with httpx.AsyncClient() as client:
        step = 0
        while True:
            step += 1
            print(f"\n--- Transmission Cycle #{step} [{datetime.now().strftime('%H:%M:%S')}] ---")
            
            # 1. Pick a random sensor node and transmit its telemetry
            node = random.choice(NODES)
            await send_single_reading_http(client, node)

            # 2. Every 3 cycles, send gateway hardware heartbeat
            if step % 3 == 0:
                await send_gateway_heartbeat_http(client)

            # 3. If there are buffered packets, flush them
            if gateway_state["buffer_queue"]:
                await send_store_and_forward_sync_http(client)

            await asyncio.sleep(4)

if __name__ == "__main__":
    asyncio.run(run_gateway_loop())
