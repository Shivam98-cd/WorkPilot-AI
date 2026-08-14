"""
Integration Agents Package

Multi-AI agent system for managing third-party integrations.
"""
from agents.base_agent import BaseIntegrationAgent
from agents.google_workspace_agent import GoogleWorkspaceAgent
from agents.microsoft_agent import MicrosoftAgent
from agents.devtools_agent import DevToolsAgent
from agents.communication_agent import CommunicationAgent
from agents.productivity_agent import ProductivityAgent

__all__ = [
    "BaseIntegrationAgent",
    "GoogleWorkspaceAgent",
    "MicrosoftAgent",
    "DevToolsAgent",
    "CommunicationAgent",
    "ProductivityAgent",
]
