"""
Unit tests for Vector Knowledge RAG Service and WebSocket Manager
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from services.vector_knowledge_service import VectorKnowledgeService, chunk_text, extract_text_from_bytes
from services.websocket_manager import WebSocketConnectionManager


class TestVectorKnowledgeService:
    def setup_method(self):
        self.service = VectorKnowledgeService()
        self.uid = "user_test_999"

    def test_chunk_text(self):
        text = "WorkPilot AI is an enterprise workspace platform. It unifies email, calendars, and tasks into an AI cockpit. It connects to Google, Microsoft, Slack, and Zoom."
        chunks = chunk_text(text, chunk_size=100, overlap=20)
        assert len(chunks) >= 1
        assert "WorkPilot AI" in chunks[0]["text"]

    def test_index_and_semantic_search(self):
        doc_id = "doc_test_1"
        content = "The annual revenue for Q3 was 4.2 million dollars. Operational expenditure was kept under 1.5 million. Headcount increased by 15 percent across all engineering departments."
        
        indexed_chunks = self.service.index_document(
            uid=self.uid,
            doc_id=doc_id,
            title="Q3 Financial Overview",
            text=content,
            metadata={"category": "finance"}
        )
        assert indexed_chunks > 0

        # Search for revenue
        results = self.service.semantic_search(
            uid=self.uid,
            query="What was the Q3 revenue?",
            top_k=2
        )
        assert len(results) > 0
        assert "revenue" in results[0]["text"].lower() or "million" in results[0]["text"].lower()

    def test_answer_query(self):
        doc_id = "doc_test_policy"
        self.service.index_document(
            uid=self.uid,
            doc_id=doc_id,
            title="Remote Work Policy",
            text="Employees are entitled to 2 remote work days per week with manager approval. Flexible hours apply between 9 AM and 6 PM.",
            metadata={"type": "hr"}
        )
        res = self.service.answer_query(
            uid=self.uid,
            doc_id=doc_id,
            question="How many remote days are allowed?"
        )
        assert "Remote Work Policy" in res["answer"]
        assert len(res["sources"]) > 0


@pytest.mark.asyncio
class TestWebSocketManager:
    async def test_websocket_connect_and_disconnect(self):
        manager = WebSocketConnectionManager()
        mock_ws = AsyncMock()

        await manager.connect("user_123", mock_ws)
        assert "user_123" in manager.active_connections
        assert mock_ws in manager.active_connections["user_123"]

        # Send personal message
        await manager.send_personal_message("user_123", {"type": "test", "data": "hello"})
        mock_ws.send_text.assert_called_once()

        # Disconnect
        manager.disconnect("user_123", mock_ws)
        assert "user_123" not in manager.active_connections
