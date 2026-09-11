"""
End-to-End Verification Test for Gateway HTTP Telemetry Ingestion
Tests JSON ingestion, array batch ingestion, store-and-forward sync, and CSV upload.
"""
import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from main import app
from database import connect_to_mongo, close_mongo_connection
from datetime import datetime

async def test_all_gateway_http_flows():
    print("Testing Gateway HTTP Ingestion Endpoints with Dataset Schema...")
    await connect_to_mongo()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", follow_redirects=True) as client:
        # 1. Health check
        res = await client.get("/api/health")
        print(f"1. Health Check: {res.status_code} - {res.json()}")
        assert res.status_code == 200

        # 2. Single Sensor Reading via HTTP POST to /api/ingest matching user table
        reading_payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "node_id": "1",
            "sector": 1,
            "x": 0,
            "y": 200,
            "tilt_x": -0.02589,
            "tilt_y": 0.089886,
            "acceleration": 9.775479,
            "vibration": 0.059975,
            "temperature": 20.05622,
            "humidity": 63.33095,
            "pressure": 1013.014,
            "soil_moist": 20.75768,
            "battery": 61.56769,
            "packet_loss": 0.037207,
            "anomaly_score": 6.494905,
            "risk_score": 4.095286,
            "risk_level": "NORMAL",
            "node_status": "ONLINE"
        }
        res = await client.post(
            "/api/ingest",
            json=reading_payload,
            headers={"X-Gateway-Key": "geosentinel_gw_secret_key"}
        )
        print(f"2. Single Node Ingest (Row #1): {res.status_code} - {res.json()}")
        assert res.status_code == 200
        assert res.json()["processed_count"] == 1

        # 3. Batch Array of Readings via HTTP POST to /api/ingest
        batch_payload = [
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
            }
        ]
        res = await client.post(
            "/api/ingest",
            json=batch_payload,
            headers={"X-Gateway-Key": "geosentinel_gw_secret_key"}
        )
        print(f"3. Batch Array Ingest (Rows #2, #3): {res.status_code} - {res.json()}")
        assert res.status_code == 200
        assert res.json()["processed_count"] == 2

        # 4. CSV File Upload via POST /api/ingest/csv
        csv_file_path = os.path.join(os.path.dirname(__file__), "sample_telemetry_data.csv")
        with open(csv_file_path, "rb") as f:
            files = {"file": ("sample_telemetry_data.csv", f, "text/csv")}
            res = await client.post(
                "/api/ingest/csv",
                files=files,
                headers={"X-Gateway-Key": "geosentinel_gw_secret_key"}
            )
        print(f"4. CSV Ingest Upload: {res.status_code} - Rows Processed: {res.json().get('rows_processed')}")
        assert res.status_code == 200
        assert res.json()["rows_processed"] == 7

        # 5. Dashboard Summary Metrics
        res = await client.get("/api/dashboard/summary")
        print(f"5. Dashboard Summary: {res.status_code} - {res.json()}")
        assert res.status_code == 200
        assert res.json()["total_nodes"] >= 7

        # 6. Heatmap Data with X/Y Coordinates and Geotechnical Metrics
        res = await client.get("/api/dashboard/heatmap")
        print(f"6. Heatmap Nodes: {res.status_code} - Count: {len(res.json())}")
        assert res.status_code == 200
        assert len(res.json()) >= 7

        print("\n ALL DATASET & GATEWAY HTTP INGESTION TESTS PASSED! ")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_all_gateway_http_flows())
