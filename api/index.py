import sys
import os

# Add backend directory to sys.path so backend modules can be imported
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from main import app
except Exception as err:
    import logging
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    
    logger = logging.getLogger("vercel_entry")
    logger.warning(f"Note loading backend: {err}")
    
    app = FastAPI(title="Geosentinel API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/api/health")
    async def health():
        return {"status": "ok", "mode": "serverless"}

    @app.get("/api/nodes")
    async def get_nodes():
        return []

    @app.get("/api/reports")
    async def get_reports():
        return []
