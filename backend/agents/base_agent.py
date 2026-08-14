"""
Base Integration Agent

Abstract base class for all platform-specific integration agents.
Provides common interface and utility methods.
"""
import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from functools import wraps
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class AgentHealth:
    """Health status of an integration agent"""
    platform: str
    status: str  # "healthy", "degraded", "down"
    token_valid: bool
    last_sync: Optional[datetime]
    error_count: int
    response_time_ms: float
    message: Optional[str] = None


@dataclass
class SyncResult:
    """Result of a sync operation"""
    platform: str
    success: bool
    items_synced: int
    last_sync: datetime
    errors: List[str]
    next_sync: Optional[datetime] = None


def retry_with_backoff(max_attempts: int = 3, backoff_seconds: int = 5):
    """
    Decorator for retrying failed operations with exponential backoff.
    
    Args:
        max_attempts: Maximum number of retry attempts
        backoff_seconds: Base backoff time in seconds (exponential)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        wait_time = backoff_seconds * (2 ** attempt)
                        logger.warning(
                            f"Attempt {attempt + 1}/{max_attempts} failed for {func.__name__}: {e}. "
                            f"Retrying in {wait_time}s..."
                        )
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(
                            f"All {max_attempts} attempts failed for {func.__name__}: {e}"
                        )
            raise last_exception
        return wrapper
    return decorator


class BaseIntegrationAgent(ABC):
    """
    Abstract base class for all integration agents.
    
    Each platform-specific agent must implement:
    - connect: Establish connection with platform
    - sync: Synchronize data from platform
    - disconnect: Disconnect and cleanup
    - health_check: Check agent health status
    - refresh_token: Refresh OAuth token if needed
    """
    
    def __init__(self, platform: str):
        """
        Initialize base agent.
        
        Args:
            platform: Platform identifier (e.g., 'gmail', 'github')
        """
        self.platform = platform
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        self._error_count = 0
    
    @abstractmethod
    async def connect(self, uid: str, tokens: Dict[str, Any]) -> bool:
        """
        Establish connection to the platform.
        
        Args:
            uid: User ID
            tokens: Dictionary containing access_token, refresh_token, etc.
        
        Returns:
            True if connection successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def sync(self, uid: str) -> SyncResult:
        """
        Synchronize data from the platform.
        
        Args:
            uid: User ID
        
        Returns:
            SyncResult with details of sync operation
        """
        pass
    
    @abstractmethod
    async def disconnect(self, uid: str) -> bool:
        """
        Disconnect from the platform and cleanup resources.
        
        Args:
            uid: User ID
        
        Returns:
            True if disconnection successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def health_check(self, uid: str) -> AgentHealth:
        """
        Check the health status of the agent.
        
        Args:
            uid: User ID
        
        Returns:
            AgentHealth object with current status
        """
        pass
    
    @abstractmethod
    async def refresh_token(self, uid: str) -> bool:
        """
        Refresh OAuth token if expired or expiring soon.
        
        Args:
            uid: User ID
        
        Returns:
            True if token refreshed successfully, False otherwise
        """
        pass
    
    def _increment_error_count(self) -> None:
        """Increment internal error counter"""
        self._error_count += 1
    
    def _reset_error_count(self) -> None:
        """Reset internal error counter"""
        self._error_count = 0
    
    def _get_error_count(self) -> int:
        """Get current error count"""
        return self._error_count
    
    async def _check_token_expiry(
        self, 
        token_expires_at: Optional[datetime],
        refresh_threshold_minutes: int = 5
    ) -> bool:
        """
        Check if token is expired or expiring soon.
        
        Args:
            token_expires_at: Token expiration datetime
            refresh_threshold_minutes: Refresh if expires within this many minutes
        
        Returns:
            True if token needs refresh, False otherwise
        """
        if not token_expires_at:
            return False
        
        now = datetime.utcnow()
        time_until_expiry = (token_expires_at - now).total_seconds() / 60
        
        return time_until_expiry < refresh_threshold_minutes
    
    def _log_operation(self, operation: str, success: bool, details: str = "") -> None:
        """
        Log agent operation.
        
        Args:
            operation: Name of operation
            success: Whether operation succeeded
            details: Additional details
        """
        level = logging.INFO if success else logging.ERROR
        status = "SUCCESS" if success else "FAILED"
        message = f"[{self.platform}] {operation} {status}"
        if details:
            message += f": {details}"
        self.logger.log(level, message)
