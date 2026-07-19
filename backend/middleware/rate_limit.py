"""
Rate Limiting Middleware
"""
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from typing import Dict
from core.exceptions import RateLimitException


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting (use Redis in production)"""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts: Dict[str, list] = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        current_time = time.time()
        
        self.request_counts[client_ip] = [
            req_time for req_time in self.request_counts[client_ip]
            if current_time - req_time < 60
        ]
        
        if len(self.request_counts[client_ip]) >= self.requests_per_minute:
            raise RateLimitException("Too many requests. Please try again later.")
        
        self.request_counts[client_ip].append(current_time)
        
        response = await call_next(request)
        return response
