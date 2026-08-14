"""
DevTools Agent

Handles GitHub and Jira integrations for development workflows.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from agents.base_agent import AgentHealth, BaseIntegrationAgent, SyncResult, retry_with_backoff
from core.crypto import decrypt_value
from models.unified_data import UnifiedTask
from repositories.integration_repository import integration_repository

logger = logging.getLogger(__name__)


class DevToolsAgent(BaseIntegrationAgent):
    """
    Agent for development tools: GitHub and Jira.
    
    Handles repository management, issue tracking, PR reviews, and sprint planning.
    """
    
    def __init__(self):
        super().__init__(platform="devtools")
    
    async def connect(self, uid: str, tokens: Dict[str, Any]) -> bool:
        """Test connection to GitHub/Jira"""
        try:
            self._log_operation("connect", True, f"User {uid}")
            self._reset_error_count()
            return True
        except Exception as e:
            self._log_operation("connect", False, str(e))
            self._increment_error_count()
            return False
    
    @retry_with_backoff(max_attempts=3, backoff_seconds=5)
    async def sync(self, uid: str) -> SyncResult:
        """Sync data from GitHub and Jira"""
        errors = []
        items_synced = 0
        
        try:
            # Check connected platforms
            github_integration = await integration_repository.get(uid, "github")
            jira_integration = await integration_repository.get(uid, "jira")
            
            # Sync GitHub
            if github_integration and github_integration.status == "connected":
                try:
                    issues = await self.get_github_issues(uid, limit=10)
                    items_synced += len(issues)
                except Exception as e:
                    errors.append(f"GitHub sync failed: {str(e)}")
            
            # Sync Jira
            if jira_integration and jira_integration.status == "connected":
                try:
                    issues = await self.get_jira_issues(uid, limit=10)
                    items_synced += len(issues)
                except Exception as e:
                    errors.append(f"Jira sync failed: {str(e)}")
            
            success = len(errors) == 0
            if success:
                self._reset_error_count()
            else:
                self._increment_error_count()
            
            return SyncResult(
                platform="devtools",
                success=success,
                items_synced=items_synced,
                last_sync=datetime.utcnow(),
                errors=errors
            )
        except Exception as e:
            self._increment_error_count()
            return SyncResult(
                platform="devtools",
                success=False,
                items_synced=0,
                last_sync=datetime.utcnow(),
                errors=[str(e)]
            )
    
    async def disconnect(self, uid: str) -> bool:
        """Disconnect from GitHub/Jira"""
        try:
            self._log_operation("disconnect", True, f"User {uid}")
            return True
        except Exception as e:
            self._log_operation("disconnect", False, str(e))
            return False
    
    async def health_check(self, uid: str) -> AgentHealth:
        """Check health of DevTools integrations"""
        start_time = datetime.utcnow()
        
        try:
            github_integration = await integration_repository.get(uid, "github")
            jira_integration = await integration_repository.get(uid, "jira")
            
            if not github_integration and not jira_integration:
                return AgentHealth(
                    platform="devtools",
                    status="down",
                    token_valid=False,
                    last_sync=None,
                    error_count=0,
                    response_time_ms=0
                )
            
            # Use GitHub as primary health indicator
            primary = github_integration or jira_integration
            
            end_time = datetime.utcnow()
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            
            status = "healthy" if self._get_error_count() < 5 else "degraded"
            
            return AgentHealth(
                platform="devtools",
                status=status,
                token_valid=True,
                last_sync=primary.last_sync_at,
                error_count=self._get_error_count(),
                response_time_ms=response_time_ms
            )
        except Exception as e:
            return AgentHealth(
                platform="devtools",
                status="down",
                token_valid=False,
                last_sync=None,
                error_count=999,
                response_time_ms=0,
                message=str(e)
            )
    
    async def refresh_token(self, uid: str) -> bool:
        """Refresh OAuth tokens"""
        try:
            self._log_operation("refresh_token", True, f"User {uid}")
            return True
        except Exception as e:
            self._log_operation("refresh_token", False, str(e))
            return False
    
    # ========================================================================
    # GitHub-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_github_issues(
        self,
        uid: str,
        limit: int = 20,
        state: str = "open"
    ) -> List[UnifiedTask]:
        """Get GitHub issues"""
        integration = await integration_repository.get(uid, "github")
        if not integration or integration.status != "connected":
            return []
        
        # Mock data for now
        mock_issues = [
            UnifiedTask(
                id=f"gh_issue_{i}",
                platform="github",
                title=f"Issue #{i}: Bug in authentication",
                description=f"Description for issue {i}",
                status="open" if i % 2 == 0 else "in_progress",
                assignee=f"developer{i}",
                labels=["bug", "priority:high"],
                priority="high" if i < 2 else "normal",
                project="workpilot-ai",
                url=f"https://github.com/workpilot/repo/issues/{i}"
            )
            for i in range(1, min(limit + 1, 6))
        ]
        
        logger.info(f"Fetched {len(mock_issues)} GitHub issues for user {uid}")
        return mock_issues
    
    async def create_github_issue(
        self,
        uid: str,
        repo: str,
        title: str,
        body: str,
        labels: Optional[List[str]] = None
    ) -> str:
        """Create GitHub issue"""
        logger.info(f"Creating GitHub issue in {repo}: {title}")
        # TODO: Implement with PyGithub
        issue_url = f"https://github.com/{repo}/issues/123"
        return issue_url
    
    async def get_github_prs(
        self,
        uid: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get GitHub pull requests"""
        logger.info(f"Fetching GitHub PRs for user {uid}")
        # TODO: Implement with PyGithub
        return []
    
    # ========================================================================
    # Jira-specific methods
    # ========================================================================
    
    @retry_with_backoff(max_attempts=2, backoff_seconds=3)
    async def get_jira_issues(
        self,
        uid: str,
        limit: int = 20,
        jql: Optional[str] = None
    ) -> List[UnifiedTask]:
        """Get Jira issues"""
        integration = await integration_repository.get(uid, "jira")
        if not integration or integration.status != "connected":
            return []
        
        # Mock data for now
        mock_issues = [
            UnifiedTask(
                id=f"PROJ-{i}",
                platform="jira",
                title=f"[PROJ-{i}] Implement feature X",
                description=f"Description for Jira issue {i}",
                status="in_progress" if i % 2 == 0 else "open",
                assignee=f"developer{i}@company.com",
                labels=["feature", "sprint-5"],
                priority="high" if i < 3 else "normal",
                project="WorkPilot Project",
                url=f"https://company.atlassian.net/browse/PROJ-{i}"
            )
            for i in range(1, min(limit + 1, 6))
        ]
        
        logger.info(f"Fetched {len(mock_issues)} Jira issues for user {uid}")
        return mock_issues
    
    async def create_jira_issue(
        self,
        uid: str,
        project_key: str,
        summary: str,
        description: str,
        issue_type: str = "Task"
    ) -> str:
        """Create Jira issue"""
        logger.info(f"Creating Jira issue in {project_key}: {summary}")
        # TODO: Implement with atlassian-python-api
        issue_key = f"{project_key}-123"
        return f"https://company.atlassian.net/browse/{issue_key}"
    
    async def get_issues(self, uid: str, limit: int = 20) -> List[UnifiedTask]:
        """
        Get issues from all connected dev platforms.
        
        Helper method for unified endpoint.
        """
        all_issues = []
        
        # Get GitHub issues
        try:
            github_issues = await self.get_github_issues(uid, limit=limit // 2)
            all_issues.extend(github_issues)
        except Exception as e:
            logger.error(f"Failed to get GitHub issues: {e}")
        
        # Get Jira issues
        try:
            jira_issues = await self.get_jira_issues(uid, limit=limit // 2)
            all_issues.extend(jira_issues)
        except Exception as e:
            logger.error(f"Failed to get Jira issues: {e}")
        
        return all_issues
