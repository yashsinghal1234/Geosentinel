from fastapi import Request, HTTPException, status
from config import settings
from database import get_db
import logging

logger = logging.getLogger(__name__)

async def verify_ingest_auth(request: Request) -> dict:
    """
    Validates HTTP requests coming from Gateway appliances or direct IoT sensor nodes.
    Supports:
      - Header 'X-API-Key'
      - Header 'X-Gateway-Key'
      - Header 'Authorization: Bearer <key>'
      - Query parameter '?api_key=...'
      - Configured master GATEWAY_API_KEY
      - Per-node api_key registered in MongoDB
      - Permissive fallback in development mode / ALLOW_ANONYMOUS_INGEST=True
    """
    # 1. Extract API key from headers or query params
    api_key = (
        request.headers.get("X-API-Key")
        or request.headers.get("x-api-key")
        or request.headers.get("X-Gateway-Key")
        or request.headers.get("x-gateway-key")
        or request.query_params.get("api_key")
        or request.query_params.get("key")
    )

    auth_header = request.headers.get("Authorization")
    if not api_key and auth_header and auth_header.startswith("Bearer "):
        api_key = auth_header.split(" ", 1)[1].strip()

    # 2. Check Master Gateway Key
    if api_key and api_key == settings.GATEWAY_API_KEY:
        return {"type": "gateway", "authenticated": True, "key": api_key}

    # 3. Check Per-Node API Key in MongoDB
    db = get_db()
    if api_key and db is not None:
        node = await db.nodes.find_one({"api_key": api_key})
        if node:
            return {"type": "node", "authenticated": True, "node": node, "key": api_key}

    # 4. Check if anonymous ingestion is allowed (dev/demo/initial field setup)
    if settings.ALLOW_ANONYMOUS_INGEST or settings.ENVIRONMENT == "development":
        logger.info("Ingest HTTP request accepted under development/permissive policy")
        return {"type": "anonymous", "authenticated": False, "key": api_key or "anon"}

    # 5. Otherwise, reject
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized: Invalid or missing X-API-Key / X-Gateway-Key"
    )

# Alias for backwards compatibility
verify_node_api_key = verify_ingest_auth
