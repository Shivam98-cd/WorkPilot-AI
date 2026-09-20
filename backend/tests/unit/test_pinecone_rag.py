"""
Unit tests for Enterprise Pinecone Cloud Vector Database, Dense Embeddings,
and RAG Retrieval Pipeline in WorkPilot AI.
"""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from services.vector_knowledge_service import (
    VectorKnowledgeService,
    PineconeCloudDriver,
    generate_embedding,
    generate_embeddings,
    chunk_text,
    extract_text_from_bytes,
    EMBEDDING_DIM,
)


class TestDenseEmbeddings:
    def test_embedding_dimension_and_norm(self):
        text = "WorkPilot AI enterprise cognitive assistant and RAG pipeline."
        emb = generate_embedding(text)
        assert len(emb) == EMBEDDING_DIM
        assert all(isinstance(v, float) for v in emb)
        # Verify L2 norm is approximately 1.0
        norm = sum(v * v for v in emb) ** 0.5
        assert abs(norm - 1.0) < 0.05

    def test_deterministic_consistency(self):
        text = "Quarterly financial report Q3 revenue 4.2M"
        emb1 = generate_embedding(text)
        emb2 = generate_embedding(text)
        assert emb1 == emb2

    def test_batch_embedding_generation(self):
        texts = [
            "Meeting with engineering team at 2 PM",
            "Notion project roadmap updated",
            "Slack announcement regarding new feature release",
        ]
        embeddings = generate_embeddings(texts)
        assert len(embeddings) == 3
        for emb in embeddings:
            assert len(emb) == EMBEDDING_DIM


class TestPineconeCloudDriver:
    def test_is_available_flag(self):
        driver_no_key = PineconeCloudDriver(api_key="")
        assert not driver_no_key.is_available()

        driver_with_key = PineconeCloudDriver(api_key="pcsk_test_mock_key_123")
        assert driver_with_key.is_available()

    def test_pinecone_upsert_multi_tenant(self):
        driver = PineconeCloudDriver(api_key="pcsk_test_mock_key")
        mock_index = MagicMock()
        driver._index = mock_index

        uid = "usr_tenant_alpha"
        doc_id = "doc_contract_99"
        title = "Enterprise Service Agreement"
        chunks = [
            {"chunk_index": 0, "text": "This Agreement is made between WorkPilot AI and Client."},
            {"chunk_index": 1, "text": "The subscription fee is payable net 30 days."},
        ]
        embeddings = generate_embeddings([c["text"] for c in chunks])

        count = driver.upsert(uid, doc_id, title, chunks, embeddings)
        assert count == 2
        mock_index.upsert.assert_called_once()
        call_kwargs = mock_index.upsert.call_args[1]
        assert call_kwargs["namespace"] == f"user_{uid}"
        vectors = call_kwargs["vectors"]
        assert len(vectors) == 2
        assert vectors[0]["id"] == f"{doc_id}_chunk_0"
        assert vectors[0]["metadata"]["title"] == title
        assert vectors[0]["metadata"]["doc_id"] == doc_id

    def test_pinecone_query_multi_tenant(self):
        driver = PineconeCloudDriver(api_key="pcsk_test_mock_key")
        mock_index = MagicMock()
        mock_index.query.return_value = {
            "matches": [
                {
                    "score": 0.89,
                    "metadata": {
                        "doc_id": "doc_contract_99",
                        "title": "Enterprise Service Agreement",
                        "chunk_index": 1,
                        "text": "The subscription fee is payable net 30 days.",
                    },
                }
            ]
        }
        driver._index = mock_index

        uid = "usr_tenant_alpha"
        query_emb = generate_embedding("payment terms and subscription fee")
        results = driver.query(uid, query_emb, top_k=3, doc_id="doc_contract_99")

        assert len(results) == 1
        assert results[0]["title"] == "Enterprise Service Agreement"
        assert results[0]["score"] == 0.89
        assert results[0]["source"] == "pinecone_cloud"

        # Verify query was called with strict tenant namespace
        call_kwargs = mock_index.query.call_args[1]
        assert call_kwargs["namespace"] == f"user_{uid}"
        assert call_kwargs["filter"] == {"doc_id": {"$eq": "doc_contract_99"}}

    def test_pinecone_delete_by_doc_id(self):
        driver = PineconeCloudDriver(api_key="pcsk_test_mock_key")
        mock_index = MagicMock()
        driver._index = mock_index

        uid = "usr_tenant_alpha"
        doc_id = "doc_contract_99"
        deleted = driver.delete(uid, doc_id)
        assert deleted is True
        mock_index.delete.assert_called_once_with(
            filter={"doc_id": {"$eq": doc_id}},
            namespace=f"user_{uid}",
        )


class TestVectorKnowledgeServiceEndToEnd:
    def test_local_fallback_when_no_pinecone_key(self):
        """Zero-downtime test: Service operates seamlessly using local engine when Pinecone is unconfigured."""
        service = VectorKnowledgeService(pinecone_driver=PineconeCloudDriver(api_key=""))
        uid = "local_user_456"
        doc_id = "policy_doc"
        text = "WorkPilot AI security policy requires multi-factor authentication for all administrators. Passwords must be 12 characters."

        indexed = service.index_document(uid, doc_id, "Security Policy", text)
        assert indexed > 0

        # Semantic Search
        results = service.semantic_search(uid, "What are the password requirements?")
        assert len(results) > 0
        assert "password" in results[0]["text"].lower() or "12 characters" in results[0]["text"].lower()
        assert results[0]["source"] == "local_vector_engine"

        # Q&A Synthesis
        res = service.answer_query(uid, doc_id, "How many characters are required for passwords?")
        assert "Security Policy" in res["answer"]
        assert len(res["sources"]) > 0

        # Delete
        assert service.delete_document(uid, doc_id) is True
        assert len(service.semantic_search(uid, "password")) == 0

    def test_multi_tenant_isolation(self):
        """Verify Tenant A cannot access Tenant B's indexed vectors."""
        service = VectorKnowledgeService(pinecone_driver=PineconeCloudDriver(api_key=""))
        
        user_a = "tenant_company_a"
        user_b = "tenant_company_b"

        service.index_document(user_a, "doc_secret_a", "Project Titan", "Secret acquisition target code name Titan budget 50M")
        service.index_document(user_b, "doc_public_b", "Public Handbook", "General onboarding guidelines for employees")

        # User B searches for User A's confidential project
        results_b = service.semantic_search(user_b, "Project Titan acquisition")
        assert len(results_b) == 0

        # User A searches
        results_a = service.semantic_search(user_a, "Project Titan acquisition")
        assert len(results_a) > 0
        assert results_a[0]["doc_id"] == "doc_secret_a"

    def test_dual_backend_with_active_pinecone(self):
        """Verify service uses Pinecone driver when configured."""
        mock_driver = MagicMock(spec=PineconeCloudDriver)
        mock_driver.is_available.return_value = True
        mock_driver.upsert.return_value = 2
        mock_driver.query.return_value = [
            {
                "doc_id": "cloud_doc_1",
                "title": "Cloud Architecture",
                "chunk_index": 0,
                "text": "Pinecone serverless cloud index with Gemini embeddings",
                "score": 0.94,
                "source": "pinecone_cloud",
            }
        ]
        mock_driver.delete.return_value = True

        service = VectorKnowledgeService(pinecone_driver=mock_driver)
        uid = "cloud_user_789"

        service.index_document(uid, "cloud_doc_1", "Cloud Architecture", "Pinecone serverless cloud index with Gemini embeddings")
        mock_driver.upsert.assert_called_once()

        results = service.semantic_search(uid, "Gemini embeddings")
        assert len(results) == 1
        assert results[0]["source"] == "pinecone_cloud"
        assert results[0]["score"] == 0.94

        deleted = service.delete_document(uid, "cloud_doc_1")
        assert deleted is True
        mock_driver.delete.assert_called_once_with(uid, "cloud_doc_1")


@pytest.mark.asyncio
class TestSuperBrainRAGIntegration:
    async def test_superbrain_query_knowledge_base_tool(self):
        """Test SuperBrain orchestrator executing query_knowledge_base tool."""
        from services.superbrain.orchestrator import SuperBrainOrchestrator
        from services.vector_knowledge_service import vector_knowledge_service

        orchestrator = SuperBrainOrchestrator()
        uid = "test_superbrain_user"
        doc_id = "sop_deployment"

        # Index document into vector knowledge service
        vector_knowledge_service.index_document(
            uid=uid,
            doc_id=doc_id,
            title="Deployment Standard Operating Procedure",
            text="Production deployments require 2 approvals and must occur between Tuesday and Thursday before 3 PM UTC."
        )

        tool_args = {"query": "What are the rules for production deployment?", "top_k": 3}
        res = await orchestrator._run_tool("query_knowledge_base", tool_args, uid)

        assert res.get("success") is True
        assert len(res.get("matches", [])) > 0
        assert "Deployment Standard Operating Procedure" in res.get("synthesized_answer", "")
        assert len(res.get("sources", [])) > 0
