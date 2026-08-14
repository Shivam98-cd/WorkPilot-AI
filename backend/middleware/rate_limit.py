"""
Rate Limiting Middleware
"""
import time
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from typing import Dict
from core.exceptions import RateLimitException


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting (use Redis in production)"""
    
    def __init__(self, app, requests_per_minute: int = 300):  # Increased limit for development
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts: Dict[str, list] = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for development endpoints
        if request.url.path.startswith("/docs") or request.url.path.startswith("/openapi"):
            return await call_next(request)
        
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean up old requests (keep only last minute)
        self.request_counts[client_ip] = [
            req_time for req_time in self.request_counts[client_ip]
            if current_time - req_time < 60
        ]
        
        # Check rate limit
        if len(self.request_counts[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Too many requests. Please try again later.",
                    "retry_after": 60
                }
            )
        
        # Record this request
        self.request_counts[client_ip].append(current_time)
        
        # Process the request
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            # Log the error but don't let it crash the server
            import logging
            logging.error(f"Error processing request: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "Internal server error"
                }
            )
