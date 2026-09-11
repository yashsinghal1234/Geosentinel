import asyncio
import httpx
import random
import time

# Simulation settings
API_URL = "http://localhost:8000/api/ingest"
NODE_ID = "N12345678" # Example node ID
API_KEY = "ak_example_api_key_123" # Must match what's in the DB

async def simulate_sensor_data():
    async with httpx.AsyncClient() as client:
        # Base values
        tilt = 1.0
        vibration = 0.5
        gas = 0.1
        crack = 0.0
        
        print("Starting simulated sensor generator...")
        while True:
            # Introduce some noise/trend
            tilt += random.uniform(-0.1, 0.2)
            vibration += random.uniform(-0.1, 0.1)
            gas += random.uniform(-0.01, 0.05)
            crack += random.uniform(0, 0.05)
            
            payload = {
                "node_id": NODE_ID,
                "tilt": max(tilt, 0),
                "vibration": max(vibration, 0),
                "gas_level": max(gas, 0),
                "crack_width": max(crack, 0)
            }
            
            headers = {"X-API-Key": API_KEY}
            
            try:
                print(f"Sending payload: {payload}")
                response = await client.post(API_URL, json=payload, headers=headers)
                print(f"Response: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Failed to send data: {e}")
                
            await asyncio.sleep(5) # Send every 5 seconds

if __name__ == "__main__":
    asyncio.run(simulate_sensor_data())
