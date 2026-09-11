from fastapi import Request, HTTPException, status
import time

# Very basic in-memory rate limiter for demonstration
# In production, use Redis or a dedicated library like slowapi

IP_REQUESTS = {}
RATE_LIMIT_DURATION = 60 # seconds
MAX_REQUESTS_PER_DURATION = 100

async def rate_limit_middleware(request: Request):
    client_ip = request.client.host
    current_time = time.time()
    
    if client_ip not in IP_REQUESTS:
        IP_REQUESTS[client_ip] = []
        
    # Clean up old requests
    IP_REQUESTS[client_ip] = [t for t in IP_REQUESTS[client_ip] if current_time - t < RATE_LIMIT_DURATION]
    
    if len(IP_REQUESTS[client_ip]) >= MAX_REQUESTS_PER_DURATION:
        raise HTTPException(status_code=429, detail="Too Many Requests")
        
    IP_REQUESTS[client_ip].append(current_time)
