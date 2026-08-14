"""
Integration API Schemas
"""
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class IntegrationItemResponse(BaseModel):
    platform: str
    displayName: str
    description: str
    category: str
    available: bool
    connected: bool
    status: str
    accountLabel: Optional[str] = None
    lastSyncAt: Optional[str] = None
    lastSyncStatus: Optional[str] = None
    scopes: List[str] = Field(default_factory=list)


class IntegrationCatalogItem(BaseModel):
    platform: str
    displayName: str
    description: str
    category: str
    available: bool
    scopes: List[str] = Field(default_factory=list)


class AuthorizeResponse(BaseModel):
    authorizeUrl: str
    platform: str


class IntegrationRequestBody(BaseModel):
    name: str
    useCase: Optional[str] = None
    email: Optional[str] = None


class ConnectBody(BaseModel):
    platform: str


class WorkflowExecuteBody(BaseModel):
    """Request body for executing cross-platform workflows"""
    workflow: str = Field(..., description="Workflow identifier")
    params: Dict[str, Any] = Field(default_factory=dict, description="Workflow parameters")

