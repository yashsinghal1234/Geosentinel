"""
GeoSentinel CSV / Dataset Replay Simulator
Streams records matching the exact geotechnical sensor telemetry dataset schema:
[timestamp, node_id, sector, x, y, tilt_x, tilt_y, acceleration, vibration, temperature,
 humidity, pressure, soil_moist, battery, packet_loss, anomaly_score, risk_score, risk_level, node_status]
over HTTP POST to the backend /api/ingest endpoint.
"""

import asyncio
import httpx
import random
from datetime import datetime

BACKEND_URL = "http://localhost:8000/api/ingest"
HEADERS = {
    "Content-Type": "application/json",
    "X-Gateway-Key": "geosentinel_gw_secret_key"
}

# Sample benchmark dataset rows matching the exact spreadsheet specification
SAMPLE_DATASET = [
    {
        "node_id": "1", "sector": 1, "x": 0, "y": 200,
        "tilt_x": -0.02589, "tilt_y": 0.089886, "acceleration": 9.775479, "vibration": 0.059975,
        "temperature": 20.05622, "humidity": 63.33095, "pressure": 1013.014, "soil_moist": 20.75768,
        "battery": 61.56769, "packet_loss": 0.037207, "anomaly_score": 6.494905, "risk_score": 4.095286,
        "risk_level": "NORMAL", "node_status": "ONLINE"
    },
    {
        "node_id": "2", "sector": 1, "x": 100, "y": 200,
        "tilt_x": 0.05428, "tilt_y": -0.06978, "acceleration": 9.763106, "vibration": 0.0,
        "temperature": 20.06984, "humidity": 63.86662, "pressure": 1013.123, "soil_moist": 28.1082,
        "battery": 63.36228, "packet_loss": 0.039151, "anomaly_score": 2.760934, "risk_score": 1.705951,
        "risk_level": "NORMAL", "node_status": "ONLINE"
    },
    {
        "node_id": "3", "sector": 1, "x": 200, "y": 200,
        "tilt_x": 0.046414, "tilt_y": -0.0231, "acceleration": 9.808903, "vibration": 0.03757,
        "temperature": 20.26063, "humidity": 60.14641, "pressure": 1012.979, "soil_moist": 21.92938,
        "battery": 61.92832, "packet_loss": 0.043648, "anomaly_score": 8.413367, "risk_score": 5.218779,
        "risk_level": "NORMAL", "node_status": "ONLINE"
    },
    {
        "node_id": "4", "sector": 1, "x": 300, "y": 200,
        "tilt_x": 0.036196, "tilt_y": -0.01534, "acceleration": 9.861983, "vibration": 0.161891,
        "temperature": 19.74448, "humidity": 61.43976, "pressure": 1012.793, "soil_moist": 32.17552,
        "battery": 63.5201, "packet_loss": 0.022041, "anomaly_score": 3.128253, "risk_score": 2.173424,
        "risk_level": "NORMAL", "node_status": "ONLINE"
    },
    {
        "node_id": "5", "sector": 2, "x": 0, "y": 100,
        "tilt_x": -0.05934, "tilt_y": -0.0321, "acceleration": 9.789224, "vibration": 0.003127,
        "temperature": 20.115, "humidity": 62.06441, "pressure": 1013.094, "soil_moist": 21.90975,
        "battery": 61.74325, "packet_loss": 0.020088, "anomaly_score": 12.54686, "risk_score": 7.665466,
        "risk_level": "NORMAL", "node_status": "ONLINE"
    },
    {
        "node_id": "6", "sector": 2, "x": 100, "y": 100,
        "tilt_x": -0.02137, "tilt_y": 0.019931, "acceleration": 9.7481, "vibration": 0.046561,
        "temperature": 19.61928, "humidity": 62.77933, "pressure": 1013.228, "soil_moist": 27.62259,
        "battery": 63.45666, "packet_loss": 0.043006, "anomaly_score": 6.175188, "risk_score": 4.067803,
        "risk_level": "NORMAL", "node_status": "ONLINE"
    },
    {
        "node_id": "7", "sector": 2, "x": 200, "y": 100,
        "tilt_x": -0.07977, "tilt_y": 0.043951, "acceleration": 9.810253, "vibration": 0.009331,
        "temperature": 20.00628, "humidity": 63.31616, "pressure": 1013.258, "soil_moist": 28.39613,
        "battery": 62.97164, "packet_loss": 0.028702, "anomaly_score": 3.854953, "risk_score": 2.588252,
        "risk_level": "NORMAL", "node_status": "ONLINE"
    }
]

async def replay_telemetry():
    print("=" * 70)
    print("📡 GeoSentinel Dataset Live Streamer")
    print(f"Target URL: {BACKEND_URL}")
    print("Streaming dataset rows matching user table schema...")
    print("=" * 70)

    async with httpx.AsyncClient() as client:
        step = 0
        while True:
            step += 1
            # Pick a row and add current timestamp and slight random variation
            base_row = dict(random.choice(SAMPLE_DATASET))
            base_row["timestamp"] = datetime.utcnow().isoformat()
            
            # Simulate real-time micro fluctuations
            base_row["tilt_x"] = round(base_row["tilt_x"] + random.uniform(-0.005, 0.005), 5)
            base_row["tilt_y"] = round(base_row["tilt_y"] + random.uniform(-0.005, 0.005), 5)
            base_row["vibration"] = round(max(0.0, base_row["vibration"] + random.uniform(-0.01, 0.02)), 5)
            base_row["temperature"] = round(base_row["temperature"] + random.uniform(-0.1, 0.1), 3)
            base_row["soil_moist"] = round(base_row["soil_moist"] + random.uniform(-0.2, 0.2), 3)

            try:
                resp = await client.post(BACKEND_URL, json=base_row, headers=HEADERS, timeout=5.0)
                res_data = resp.json()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Node #{base_row['node_id']} (Sector {base_row['sector']}, X={base_row['x']}, Y={base_row['y']}) -> HTTP {resp.status_code} | Risk: {res_data.get('results', [{}])[0].get('risk_score')}% ({res_data.get('results', [{}])[0].get('risk_level')})")
            except Exception as e:
                print(f"[ERROR] Failed to send telemetry: {e}")

            await asyncio.sleep(2.5)

if __name__ == "__main__":
    asyncio.run(replay_telemetry())
