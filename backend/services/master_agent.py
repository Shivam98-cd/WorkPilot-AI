"""
Master Integration Agent Service

Orchestrates all worker agents and provides unified API for frontend.
"""
import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from agents.base_agent import AgentHealth, BaseIntegrationAgent, SyncResult
from core.exceptions import NotFoundException, ValidationException
from models.unified_data import UnifiedEvent, UnifiedMessage, UnifiedTask
from repositories.integration_repository import integration_repository

logger = logging.getLogger(__name__)


class MasterIntegrationAgent:
    """
    Master agent that coordinates all worker agents.
    
    Responsibilities:
    - Initialize and manage worker agent instances
    - Route requests to appropriate worker agents
    - Aggregate data from multiple platforms
    - Handle cross-platform workflows
    - Maintain global sync status
    """
    
    def __init__(self):
        """Initialize master agent with worker registry"""
        self._worker_agents: Dict[str, BaseIntegrationAgent] = {}
        self._initialized = False
    
    def _initialize_agents(self) -> None:
        """Lazy initialization of worker agents"""
        if self._initialized:
            return
        
        try:
            from agents.google_workspace_agent import GoogleWorkspaceAgent
            from agents.microsoft_agent import MicrosoftAgent
            from agents.devtools_agent import DevToolsAgent
            from agents.communication_agent import CommunicationAgent
            from agents.productivity_agent import ProductivityAgent
            
            # Initialize Google Workspace agent (handles gmail, google_calendar, google_drive, google_meet)
            google_agent = GoogleWorkspaceAgent()
            self.register_agent("gmail", google_agent)
            self.register_agent("google_calendar", google_agent)
            self.register_agent("google_drive", google_agent)
            self.register_agent("google_meet", google_agent)
            
            # Initialize Microsoft agent (handles outlook, microsoft_365, microsoft_teams)
            microsoft_agent = MicrosoftAgent()
            self.register_agent("outlook", microsoft_agent)
            self.register_agent("microsoft_365", microsoft_agent)
            self.register_agent("microsoft_teams", microsoft_agent)
            
            # Initialize DevTools agent (handles github, jira)
            devtools_agent = DevToolsAgent()
            self.register_agent("github", devtools_agent)
            self.register_agent("jira", devtools_agent)
            
            # Initialize Communication agent (handles slack, zoom)
            communication_agent = CommunicationAgent()
            self.register_agent("slack", communication_agent)
            self.register_agent("zoom", communication_agent)
            
            # Initialize Productivity agent (handles notion, trello)
            productivity_agent = ProductivityAgent()
            self.register_agent("notion", productivity_agent)
            self.register_agent("trello", productivity_agent)
            
            self._initialized = True
            logger.info(f"Initialized master agent with {len(self._worker_agents)} platform mappings")
            
        except Exception as e:
            logger.error(f"Failed to initialize worker agents: {e}")
            # Continue without agents - will fail gracefully on usage
    
    def register_agent(self, platform: str, agent: BaseIntegrationAgent) -> None:
        """
        Register a worker agent for a platform.
        
        Args:
            platform: Platform identifier (e.g., 'gmail', 'github')
            agent: Worker agent instance
        """
        self._worker_agents[platform] = agent
        logger.debug(f"Registered worker agent for platform: {platform}")
    
    def get_agent(self, platform: str) -> Optional[BaseIntegrationAgent]:
        """
        Get worker agent for a platform.
        
        Args:
            platform: Platform identifier
        
        Returns:
            Worker agent instance or None if not found
        """
        # Ensure agents are initialized
        if not self._initialized:
            self._initialize_agents()
        
        return self._worker_agents.get(platform)
    
    async def sync_all_integrations(self, uid: str) -> Dict[str, Any]:
        """
        Sync all connected integrations for a user concurrently.
        
        Args:
            uid: User ID
        
        Returns:
            Dictionary with sync results for each platform
        """
        # Get all connected integrations for user
        integrations = await integration_repository.list_for_user(uid)
        connected_platforms = [
            i.platform for i in integrations if i.status == "connected"
        ]
        
        if not connected_platforms:
            return {
                "status": "no_integrations",
                "message": "No connected integrations found",
                "results": {},
            }
        
        logger.info(f"Syncing {len(connected_platforms)} platforms for user {uid}")
        
        # Create sync tasks for all platforms
        sync_tasks = []
        platform_map = {}
        
        for platform in connected_platforms:
            agent = self.get_agent(platform)
            if agent:
                task = agent.sync(uid)
                sync_tasks.append(task)
                platform_map[len(sync_tasks) - 1] = platform
        
        # Execute syncs concurrently
        results = await asyncio.gather(*sync_tasks, return_exceptions=True)
        
        # Process results
        sync_results = {}
        success_count = 0
        error_count = 0
        
        for idx, result in enumerate(results):
            platform = platform_map[idx]
            
            if isinstance(result, Exception):
                logger.error(f"Sync failed for {platform}: {result}")
                sync_results[platform] = {
                    "success": False,
                    "error": str(result),
                    "timestamp": datetime.utcnow().isoformat(),
                }
                error_count += 1
            elif isinstance(result, SyncResult):
                sync_results[platform] = {
                    "success": result.success,
                    "items_synced": result.items_synced,
                    "errors": result.errors,
                    "timestamp": result.last_sync.isoformat(),
                }
                if result.success:
                    success_count += 1
                else:
                    error_count += 1
        
        return {
            "status": "completed",
            "total_platforms": len(connected_platforms),
            "success_count": success_count,
            "error_count": error_count,
            "results": sync_results,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    async def sync_platform(self, uid: str, platform: str) -> SyncResult:
        """
        Sync a specific platform for a user.
        
        Args:
            uid: User ID
            platform: Platform identifier
        
        Returns:
            SyncResult with sync details
        
        Raises:
            NotFoundException: If integration not found
            ValidationException: If platform not supported
        """
        agent = self.get_agent(platform)
        if not agent:
            raise ValidationException(f"Platform '{platform}' not supported")
        
        # Check if user has this integration connected
        integration = await integration_repository.get(uid, platform)
        if not integration or integration.status != "connected":
            raise NotFoundException(f"Integration '{platform}' not connected")
        
        logger.info(f"Syncing platform {platform} for user {uid}")
        return await agent.sync(uid)
    
    async def get_unified_inbox(
        self,
        uid: str,
        limit: int = 50,
        platforms: Optional[List[str]] = None
    ) -> List[UnifiedMessage]:
        """
        Get unified inbox from all email platforms.
        
        Args:
            uid: User ID
            limit: Maximum messages to return per platform
            platforms: Optional list of platforms to include (default: all email platforms)
        
        Returns:
            List of UnifiedMessage objects sorted by timestamp (newest first)
        """
        # Default email platforms
        if platforms is None:
            platforms = ["gmail", "outlook"]
        
        # Get connected email integrations
        integrations = await integration_repository.list_for_user(uid)
        connected_email_platforms = [
            i.platform for i in integrations
            if i.platform in platforms and i.status == "connected"
        ]
        
        if not connected_email_platforms:
            return []
        
        logger.info(f"Fetching unified inbox from {len(connected_email_platforms)} platforms")
        
        # Fetch messages from each platform concurrently
        fetch_tasks = []
        platform_map = {}
        
        for platform in connected_email_platforms:
            agent = self.get_agent(platform)
            if agent and hasattr(agent, "get_messages"):
                task = agent.get_messages(uid, limit=limit)
                fetch_tasks.append(task)
                platform_map[len(fetch_tasks) - 1] = platform
        
        if not fetch_tasks:
            return []
        
        results = await asyncio.gather(*fetch_tasks, return_exceptions=True)
        
        # Merge and sort messages
        all_messages: List[UnifiedMessage] = []
        
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                platform = platform_map[idx]
                logger.error(f"Failed to fetch messages from {platform}: {result}")
            elif isinstance(result, list):
                all_messages.extend(result)
        
        # Sort by timestamp (newest first) and limit
        all_messages.sort(key=lambda m: m.timestamp, reverse=True)
        return all_messages[:limit * 2]  # Return up to limit * 2 total messages
    
    async def get_unified_calendar(
        self,
        uid: str,
        days_ahead: int = 7,
        platforms: Optional[List[str]] = None
    ) -> List[UnifiedEvent]:
        """
        Get unified calendar from all calendar platforms.
        
        Args:
            uid: User ID
            days_ahead: Number of days ahead to fetch events
            platforms: Optional list of platforms to include (default: all calendar platforms)
        
        Returns:
            List of UnifiedEvent objects sorted by start time
        """
        # Default calendar platforms
        if platforms is None:
            platforms = ["google_calendar", "outlook", "zoom"]
        
        # Get connected calendar integrations
        integrations = await integration_repository.list_for_user(uid)
        connected_calendar_platforms = [
            i.platform for i in integrations
            if i.platform in platforms and i.status == "connected"
        ]
        
        if not connected_calendar_platforms:
            return []
        
        logger.info(f"Fetching unified calendar from {len(connected_calendar_platforms)} platforms")
        
        # Fetch events from each platform concurrently
        fetch_tasks = []
        platform_map = {}
        
        for platform in connected_calendar_platforms:
            agent = self.get_agent(platform)
            if agent and hasattr(agent, "get_events"):
                task = agent.get_events(uid, days_ahead=days_ahead)
                fetch_tasks.append(task)
                platform_map[len(fetch_tasks) - 1] = platform
        
        if not fetch_tasks:
            return []
        
        results = await asyncio.gather(*fetch_tasks, return_exceptions=True)
        
        # Merge and sort events
        all_events: List[UnifiedEvent] = []
        
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                platform = platform_map[idx]
                logger.error(f"Failed to fetch events from {platform}: {result}")
            elif isinstance(result, list):
                all_events.extend(result)
        
        # Sort by start time
        all_events.sort(key=lambda e: e.start)
        return all_events
    
    async def health_check(self, uid: str) -> Dict[str, AgentHealth]:
        """
        Check health of all connected integrations.
        
        Args:
            uid: User ID
        
        Returns:
            Dictionary mapping platform to AgentHealth
        """
        integrations = await integration_repository.list_for_user(uid)
        connected_platforms = [
            i.platform for i in integrations if i.status == "connected"
        ]
        
        if not connected_platforms:
            return {}
        
        logger.info(f"Checking health of {len(connected_platforms)} platforms")
        
        # Create health check tasks
        health_tasks = []
        platform_map = {}
        
        for platform in connected_platforms:
            agent = self.get_agent(platform)
            if agent:
                task = agent.health_check(uid)
                health_tasks.append(task)
                platform_map[len(health_tasks) - 1] = platform
        
        results = await asyncio.gather(*health_tasks, return_exceptions=True)
        
        # Process results
        health_status = {}
        
        for idx, result in enumerate(results):
            platform = platform_map[idx]
            
            if isinstance(result, Exception):
                logger.error(f"Health check failed for {platform}: {result}")
                health_status[platform] = AgentHealth(
                    platform=platform,
                    status="down",
                    token_valid=False,
                    last_sync=None,
                    error_count=999,
                    response_time_ms=0,
                    message=str(result),
                )
            elif isinstance(result, AgentHealth):
                health_status[platform] = result
        
        return health_status
    
    async def execute_workflow(
        self,
        uid: str,
        workflow: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a cross-platform workflow.
        
        Args:
            uid: User ID
            workflow: Workflow identifier (e.g., 'email_to_github_issue')
            params: Workflow parameters
        
        Returns:
            Dictionary with workflow execution result
        
        Raises:
            ValidationException: If workflow not supported
        """
        logger.info(f"Executing workflow '{workflow}' for user {uid}")
        
        # Workflow registry
        workflows = {
            "email_to_github_issue": self._workflow_email_to_github_issue,
            "calendar_to_slack": self._workflow_calendar_to_slack,
            "github_pr_to_email": self._workflow_github_pr_to_email,
        }
        
        workflow_func = workflows.get(workflow)
        if not workflow_func:
            raise ValidationException(f"Workflow '{workflow}' not supported")
        
        return await workflow_func(uid, params)
    
    async def _workflow_email_to_github_issue(
        self,
        uid: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Workflow: Create GitHub issue from email.
        
        Required params: email_id, email_platform, repo
        """
        # Get email agent
        email_platform = params.get("email_platform", "gmail")
        email_agent = self.get_agent(email_platform)
        if not email_agent or not hasattr(email_agent, "get_message"):
            raise ValidationException(f"Email platform '{email_platform}' not available")
        
        # Get GitHub agent
        github_agent = self.get_agent("github")
        if not github_agent or not hasattr(github_agent, "create_issue"):
            raise ValidationException("GitHub integration not available")
        
        # Fetch email
        email_id = params.get("email_id")
        message = await email_agent.get_message(uid, email_id)
        
        # Create GitHub issue
        repo = params.get("repo")
        issue_url = await github_agent.create_issue(
            uid=uid,
            repo=repo,
            title=message.subject,
            body=message.body,
            labels=["customer-feedback"],
        )
        
        # Optional: Reply to email with issue link
        if params.get("reply_to_email", False):
            await email_agent.reply_to_message(
                uid, email_id, f"GitHub issue created: {issue_url}"
            )
        
        return {
            "status": "success",
            "workflow": "email_to_github_issue",
            "issue_url": issue_url,
            "email_id": email_id,
        }
    
    async def _workflow_calendar_to_slack(
        self,
        uid: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Workflow: Send upcoming calendar events to Slack.
        
        Required params: channel_id
        """
        # Get calendar events
        events = await self.get_unified_calendar(uid, days_ahead=1)
        
        # Get Slack agent
        slack_agent = self.get_agent("slack")
        if not slack_agent or not hasattr(slack_agent, "send_message"):
            raise ValidationException("Slack integration not available")
        
        # Format message
        channel_id = params.get("channel_id")
        message = f"📅 *Your schedule for today:*\n\n"
        
        for event in events[:5]:  # Top 5 events
            message += f"• {event.title} at {event.start.strftime('%I:%M %p')}\n"
        
        # Send to Slack
        await slack_agent.send_message(uid, channel_id, message)
        
        return {
            "status": "success",
            "workflow": "calendar_to_slack",
            "events_sent": len(events[:5]),
            "channel_id": channel_id,
        }
    
    async def _workflow_github_pr_to_email(
        self,
        uid: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Workflow: Send email notification for GitHub PR status.
        
        Required params: pr_url, recipient_email
        """
        # Placeholder for future implementation
        raise ValidationException("Workflow 'github_pr_to_email' not yet implemented")


# Singleton instance
master_agent = MasterIntegrationAgent()
