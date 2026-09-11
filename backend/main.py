from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection, get_db
from routes import ingest, nodes, alerts, reports, dashboard, checkin, auth, gateway
from services.websocket_manager import manager
from routes.auth import get_current_user
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Geosentinel Backend API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(nodes.router, prefix="/api/nodes", tags=["Nodes"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["Ingest"])
app.include_router(gateway.router, prefix="/api/gateway", tags=["Gateway"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(checkin.router, prefix="/api/checkin", tags=["Checkin"])

# Simple health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Public simplified status
@app.get("/api/status/{zone}")
async def get_public_status(zone: str):
    # Mock implementation of public status
    db = get_db()
    # E.g. find alerts for that zone (mocking that node has zone or just returning a general status)
    return {"zone": zone, "status": "Normal", "message": "No active alerts in your area."}

# WebSocket for Dashboard
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    # In a real scenario, we'd extract token from query param or headers and validate
    # to protect the websocket connection: get_current_user(token)
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Just keeping connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
