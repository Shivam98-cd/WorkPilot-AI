"""
Logging Middleware for Request/Response tracking
"""
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests and responses"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        start_time = time.time()
        
        logger.info(f"→ {request.method} {request.url.path}")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        logger.info(
            f"← {request.method} {request.url.path} "
            f"Status: {response.status_code} "
            f"Duration: {process_time:.3f}s"
        )
        
        return response
