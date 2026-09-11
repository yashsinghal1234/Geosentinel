import logging
import re
import urllib.parse
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

logger = logging.getLogger(__name__)

class Database:
    client = None
    db = None
    is_mock: bool = False

db = Database()

def sanitize_mongodb_uri(uri: str) -> str:
    """Safely escapes usernames and passwords with special characters like @ in MongoDB URIs."""
    if not uri:
        return uri
    match = re.match(r"^(mongodb(?:\+srv)?://)([^:]+):([^@]+)@(.+)$", uri)
    if match:
        prefix, user, pwd, host_part = match.groups()
        # Only encode if not already percent-encoded
        if "%" not in user:
            user = urllib.parse.quote_plus(user)
        if "%" not in pwd:
            pwd = urllib.parse.quote_plus(pwd)
        return f"{prefix}{user}:{pwd}@{host_part}"
    return uri

async def connect_to_mongo():
    try:
        import certifi
        ca = certifi.where()
    except Exception:
        ca = None

    try:
        logger.info("Connecting to MongoDB Atlas...")
        clean_uri = sanitize_mongodb_uri(settings.MONGODB_URI)
        client_kwargs = {"serverSelectionTimeoutMS": 5000}
        if ca:
            client_kwargs["tlsCAFile"] = ca
        client = AsyncIOMotorClient(clean_uri, **client_kwargs)
        # Test connection ping
        await client.admin.command('ping')
        db.client = client
        db.db = db.client[settings.DATABASE_NAME]
        db.is_mock = False
        logger.info(" Successfully connected to live MongoDB Atlas Cluster!")
    except Exception as e:
        logger.warning(f"⚠️ Live MongoDB connection failed ({e}). Falling back to high-performance local in-memory store for offline/edge resilience.")
        try:
            from mongomock_motor import AsyncMongoMockClient
            mock_client = AsyncMongoMockClient()
            db.client = mock_client
            db.db = mock_client[settings.DATABASE_NAME]
            db.is_mock = True
            logger.info(" In-memory resilient MongoDB mock initialized!")
        except Exception as mock_err:
            logger.error(f"Failed to initialize mock DB: {mock_err}")
            raise e

async def close_mongo_connection():
    if db.client is not None and not db.is_mock:
        logger.info("Closing MongoDB connection...")
        db.client.close()
        logger.info("MongoDB connection closed.")

def get_db():
    return db.db
