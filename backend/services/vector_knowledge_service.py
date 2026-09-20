"""
WorkPilot AI - Enterprise Vector Knowledge & RAG Pipeline
Provides semantic chunking, dense vector embeddings, multi-tenant Pinecone Cloud Vector Database integration,
and hybrid similarity search with LLM answer synthesis across uploaded documents and knowledge items.
"""
import io
import math
import re
import hashlib
from collections import Counter
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging

import httpx
from core.config import settings

logger = logging.getLogger("vector_knowledge")

# Dense embedding dimension (standard 768-dim compatible with Gemini text-embedding-004 & Pinecone)
EMBEDDING_DIM = 768


def extract_text_from_bytes(content: bytes, filename: str = "", content_type: str = "") -> str:
    """
    Extract readable text from document bytes, supporting PDF, text, and UTF-8 markdown.
    Includes resilient fallback parsers.
    """
    fname = (filename or "").lower()
    ctype = (content_type or "").lower()

    # 1. PDF Extraction via pypdf
    if fname.endswith(".pdf") or "pdf" in ctype:
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    extracted_pages.append(f"--- Page {i+1} ---\n{page_text.strip()}")
            if extracted_pages:
                return "\n\n".join(extracted_pages)
        except Exception as e:
            logger.warning(f"pypdf extraction failed for {filename}: {e}")

    # 2. UTF-8 decode
    try:
        text = content.decode("utf-8")
        if text.strip():
            return text
    except UnicodeDecodeError:
        pass

    # 3. Latin-1 / ASCII fallback
    try:
        text = content.decode("latin-1")
        clean_text = "".join(c for c in text if c.isprintable() or c in "\n\r\t")
        if len(clean_text) > 40:
            return clean_text
    except Exception:
        pass

    # 4. Regex string extractor fallback for binary streams
    strings = re.findall(rb"[A-Za-z0-9 ,.?!'\":;@#%&/\\-]{4,}", content)
    if strings:
        return " ".join(s.decode("latin-1", errors="ignore") for s in strings[:200])

    return ""


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 60) -> List[Dict[str, Any]]:
    """
    Split text into overlapping chunks with sentence/boundary awareness.
    """
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []

    if len(cleaned) <= chunk_size:
        return [{"chunk_index": 0, "text": cleaned, "start": 0, "end": len(cleaned)}]

    chunks = []
    start = 0
    idx = 0
    while start < len(cleaned):
        end = start + chunk_size
        if end >= len(cleaned):
            chunks.append({"chunk_index": idx, "text": cleaned[start:].strip(), "start": start, "end": len(cleaned)})
            break

        # Look for sentence or space boundary to avoid cutting words
        split_point = cleaned.rfind(". ", start + chunk_size // 2, end)
        if split_point == -1:
            split_point = cleaned.rfind(" ", start + chunk_size // 2, end)
        if split_point == -1:
            split_point = end
        else:
            split_point += 1

        chunks.append({
            "chunk_index": idx,
            "text": cleaned[start:split_point].strip(),
            "start": start,
            "end": split_point,
        })
        idx += 1
        start = max(split_point - overlap, start + 1)

    return chunks


def _tokenize(text: str) -> List[str]:
    """Simple alphanumeric tokenizer and lowercase normalizer."""
    return [w.lower() for w in re.findall(r"\b\w{2,}\b", text)]


def _deterministic_embedding(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """
    Generate a deterministic, normalized dense vector embedding (default 768 dimensions).
    Uses multi-hash pseudo-random projection so semantically overlapping texts yield
    high cosine similarity, providing a zero-dependency local vector representation.
    """
    tokens = _tokenize(text)
    vec = [0.0] * dim
    if not tokens:
        return vec

    for token in tokens:
        h = int(hashlib.sha256(token.encode("utf-8")).hexdigest(), 16)
        idx1 = h % dim
        idx2 = (h >> 16) % dim
        idx3 = (h >> 32) % dim
        sign1 = 1.0 if (h & 1) else -1.0
        sign2 = 1.0 if (h & 2) else -1.0
        sign3 = 1.0 if (h & 4) else -1.0
        vec[idx1] += sign1
        vec[idx2] += sign2 * 0.7
        vec[idx3] += sign3 * 0.5

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [round(v / norm, 6) for v in vec]


def generate_embedding(text: str) -> List[float]:
    """
    Generate a 768-dimensional dense vector embedding.
    Uses Google Gemini text-embedding-004 if GEMINI_API_KEY is configured;
    otherwise falls back to deterministic multi-hash dense projection.
    """
    cleaned = text.strip()[:2048]
    if not cleaned:
        return [0.0] * EMBEDDING_DIM

    gemini_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if gemini_key.strip():
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={gemini_key.strip()}"
            payload = {
                "model": "models/text-embedding-004",
                "content": {"parts": [{"text": cleaned}]}
            }
            with httpx.Client(timeout=8.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    values = data.get("embedding", {}).get("values")
                    if values and len(values) == EMBEDDING_DIM:
                        return [round(float(v), 6) for v in values]
        except Exception as e:
            logger.debug(f"Gemini embedding API call failed: {e}; falling back to dense vector hash.")

    return _deterministic_embedding(cleaned, dim=EMBEDDING_DIM)


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Batch embedding generator."""
    return [generate_embedding(t) for t in texts]


def _compute_sparse_vector(tokens: List[str], idf_map: Optional[Dict[str, float]] = None) -> Dict[str, float]:
    """Compute normalized term-frequency / TF-IDF vector."""
    if not tokens:
        return {}
    tf = Counter(tokens)
    total = len(tokens)
    vec = {}
    sum_sq = 0.0
    for term, count in tf.items():
        weight = (count / total) * (idf_map.get(term, 1.0) if idf_map else 1.0)
        vec[term] = weight
        sum_sq += weight * weight

    norm = math.sqrt(sum_sq) or 1.0
    return {k: v / norm for k, v in vec.items()}


def _sparse_cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """Compute cosine similarity between two normalized sparse vectors."""
    common_keys = set(vec1.keys()) & set(vec2.keys())
    return sum(vec1[k] * vec2[k] for k in common_keys)


def _dense_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two normalized dense vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    return max(0.0, min(1.0, sum(a * b for a, b in zip(vec1, vec2))))


class PineconeCloudDriver:
    """
    Multi-Tenant Pinecone Cloud Vector Database Driver.
    Enforces per-user namespace isolation (f"user_{uid}") and document-level metadata filtering.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        index_name: Optional[str] = None,
        environment: Optional[str] = None,
        host: Optional[str] = None,
    ):
        self.api_key = (api_key if api_key is not None else getattr(settings, "PINECONE_API_KEY", "") or "").strip()
        self.index_name = (index_name if index_name is not None else getattr(settings, "PINECONE_INDEX_NAME", "workpilot-rag") or "workpilot-rag").strip()
        self.environment = (environment if environment is not None else getattr(settings, "PINECONE_ENVIRONMENT", "us-east-1") or "us-east-1").strip()
        self.host = (host if host is not None else getattr(settings, "PINECONE_HOST", "") or "").strip()
        self._index = None
        self._client = None
        self._initialized = False

    def is_available(self) -> bool:
        """Returns True if a Pinecone API key is configured."""
        return bool(self.api_key)

    def _get_index(self):
        if not self.is_available():
            return None
        if self._index is not None:
            return self._index
        try:
            from pinecone import Pinecone
            self._client = Pinecone(api_key=self.api_key)
            if self.host:
                self._index = self._client.Index(name=self.index_name, host=self.host)
            else:
                self._index = self._client.Index(name=self.index_name)
            self._initialized = True
            logger.info(f"Connected to Pinecone index '{self.index_name}' successfully")
            return self._index
        except Exception as e:
            logger.warning(f"Pinecone client initialization failed: {e}")
            return None

    def upsert(
        self,
        uid: str,
        doc_id: str,
        title: str,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
    ) -> int:
        """
        Upsert document chunk vectors into Pinecone using per-user namespace isolation.
        """
        idx = self._get_index()
        if not idx:
            return 0

        namespace = f"user_{uid}"
        vectors = []
        for chunk, emb in zip(chunks, embeddings):
            c_idx = chunk["chunk_index"]
            text_snippet = chunk["text"]
            vectors.append({
                "id": f"{doc_id}_chunk_{c_idx}",
                "values": emb,
                "metadata": {
                    "doc_id": str(doc_id),
                    "chunk_index": int(c_idx),
                    "title": str(title),
                    "text": text_snippet[:1000],
                    "source": "document",
                    "indexed_at": datetime.now(timezone.utc).isoformat(),
                }
            })

        batch_size = 100
        total_upserted = 0
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            try:
                idx.upsert(vectors=batch, namespace=namespace)
                total_upserted += len(batch)
            except Exception as e:
                logger.error(f"Pinecone upsert batch failed for user {uid}, doc {doc_id}: {e}")
                raise e

        logger.info(f"Pinecone upserted {total_upserted} vectors into namespace '{namespace}' for doc '{title}'")
        return total_upserted

    def query(
        self,
        uid: str,
        query_embedding: List[float],
        top_k: int = 3,
        doc_id: Optional[str] = None,
        min_score: float = 0.05,
    ) -> List[Dict[str, Any]]:
        """
        Query Pinecone vectors for a specific user namespace with optional doc_id filter.
        """
        idx = self._get_index()
        if not idx:
            return []

        namespace = f"user_{uid}"
        filter_dict = {"doc_id": {"$eq": doc_id}} if doc_id else None

        try:
            resp = idx.query(
                vector=query_embedding,
                top_k=top_k,
                namespace=namespace,
                include_metadata=True,
                filter=filter_dict,
            )
        except Exception as e:
            logger.warning(f"Pinecone query failed for namespace '{namespace}': {e}")
            return []

        matches = []
        raw_matches = resp.get("matches", []) if isinstance(resp, dict) else getattr(resp, "matches", [])
        for m in raw_matches:
            meta = m.get("metadata", {}) if isinstance(m, dict) else getattr(m, "metadata", {})
            score = m.get("score", 0.0) if isinstance(m, dict) else getattr(m, "score", 0.0)
            if score >= min_score:
                matches.append({
                    "doc_id": meta.get("doc_id", ""),
                    "title": meta.get("title", ""),
                    "chunk_index": meta.get("chunk_index", 0),
                    "text": meta.get("text", ""),
                    "score": round(float(score), 4),
                    "source": "pinecone_cloud",
                })

        return matches

    def delete(self, uid: str, doc_id: str) -> bool:
        """
        Purge all vectors belonging to doc_id from the user's namespace in Pinecone.
        """
        idx = self._get_index()
        if not idx:
            return False

        namespace = f"user_{uid}"
        try:
            idx.delete(filter={"doc_id": {"$eq": doc_id}}, namespace=namespace)
            logger.info(f"Deleted vectors for doc '{doc_id}' in Pinecone namespace '{namespace}'")
            return True
        except Exception as e:
            logger.warning(f"Pinecone delete failed for doc '{doc_id}' in namespace '{namespace}': {e}")
            return False


class VectorKnowledgeService:
    """
    Multi-tenant enterprise semantic vector store and RAG retrieval service.
    Features dual-backend execution: Pinecone Cloud Vector Database with resilient
    in-memory local vector fallback and LLM answer synthesis.
    """

    def __init__(self, pinecone_driver: Optional[PineconeCloudDriver] = None):
        self.pinecone = pinecone_driver or PineconeCloudDriver()
        # In-memory index: uid -> { doc_id: { "meta": {...}, "chunks": [{...}], "vectors": [{...}], "dense_embeddings": [...] } }
        self._user_stores: Dict[str, Dict[str, Any]] = {}

    def index_document(
        self,
        uid: str,
        doc_id: str,
        title: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> int:
        """
        Chunk, dense-embed, and index a document into the user's store.
        If Pinecone is configured, upserts vectors to cloud Pinecone index with namespace isolation.
        """
        if not text.strip():
            return 0

        chunks = chunk_text(text)
        if not chunks:
            return 0

        # Build vocabulary IDF & sparse vectors for fast local matching
        all_tokens = [_tokenize(c["text"]) for c in chunks]
        doc_count = len(chunks)
        doc_freq = Counter()
        for t_list in all_tokens:
            doc_freq.update(set(t_list))

        idf_map = {
            term: math.log((doc_count + 1) / (df + 1)) + 1.0
            for term, df in doc_freq.items()
        }

        sparse_vectors = [_compute_sparse_vector(t_list, idf_map) for t_list in all_tokens]
        dense_embeddings = generate_embeddings([c["text"] for c in chunks])

        if uid not in self._user_stores:
            self._user_stores[uid] = {}

        self._user_stores[uid][doc_id] = {
            "title": title,
            "metadata": metadata or {},
            "indexed_at": datetime.now(timezone.utc).isoformat(),
            "chunks": chunks,
            "vectors": sparse_vectors,
            "dense_embeddings": dense_embeddings,
            "idf_map": idf_map,
            "full_text": text,
        }

        # Sync to Pinecone Cloud Vector Database if available
        if self.pinecone.is_available():
            try:
                self.pinecone.upsert(
                    uid=uid,
                    doc_id=doc_id,
                    title=title,
                    chunks=chunks,
                    embeddings=dense_embeddings,
                )
            except Exception as e:
                logger.warning(f"Pinecone cloud indexing failed, continuing with local store: {e}")

        logger.info(f"Indexed document '{title}' (doc_id={doc_id}) into {len(chunks)} chunks for user {uid}")
        return len(chunks)

    def semantic_search(
        self,
        uid: str,
        query: str,
        top_k: int = 3,
        doc_id: Optional[str] = None,
        min_score: float = 0.05,
    ) -> List[Dict[str, Any]]:
        """
        Query user documents using semantic vector similarity.
        Prioritizes Pinecone Cloud Vector search, falling back to local dense/sparse cosine similarity.
        """
        if not query.strip():
            return []

        # 1. Attempt Cloud Vector Search via Pinecone
        if self.pinecone.is_available():
            try:
                q_emb = generate_embedding(query)
                cloud_matches = self.pinecone.query(
                    uid=uid,
                    query_embedding=q_emb,
                    top_k=top_k,
                    doc_id=doc_id,
                    min_score=min_score,
                )
                if cloud_matches:
                    return cloud_matches
            except Exception as e:
                logger.warning(f"Pinecone query encountered exception, falling back to local: {e}")

        # 2. Local Fallback Semantic Search
        if uid not in self._user_stores:
            return []

        query_tokens = _tokenize(query)
        if not query_tokens:
            return []

        user_docs = self._user_stores[uid]
        targets = {doc_id: user_docs[doc_id]} if doc_id and doc_id in user_docs else user_docs

        q_dense = generate_embedding(query)
        results = []
        for d_id, doc_data in targets.items():
            idf = doc_data.get("idf_map", {})
            query_vec = _compute_sparse_vector(query_tokens, idf)

            for i, (chunk, chunk_vec) in enumerate(zip(doc_data["chunks"], doc_data["vectors"])):
                sparse_score = _sparse_cosine_similarity(query_vec, chunk_vec)

                # Dense cosine similarity score
                dense_score = 0.0
                if "dense_embeddings" in doc_data and i < len(doc_data["dense_embeddings"]):
                    dense_score = _dense_cosine_similarity(q_dense, doc_data["dense_embeddings"][i])

                # Hybrid blended score (60% sparse / exact term match + 40% dense semantic)
                combined_score = (sparse_score * 0.6) + (dense_score * 0.4)

                # Word-overlap boost for exact phrase hits
                overlap_count = sum(1 for q in query_tokens if q in chunk["text"].lower())
                if overlap_count > 0:
                    combined_score += 0.05 * min(overlap_count, 4)

                if combined_score >= min_score:
                    results.append({
                        "doc_id": d_id,
                        "title": doc_data["title"],
                        "chunk_index": i,
                        "text": chunk["text"],
                        "score": round(combined_score, 4),
                        "source": "local_vector_engine",
                    })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def answer_query(self, uid: str, doc_id: str, question: str) -> Dict[str, Any]:
        """
        Retrieve relevant excerpts and synthesize a grounded answer using Groq / Gemini LLM.
        """
        matches = self.semantic_search(uid, question, top_k=3, doc_id=doc_id)
        if not matches:
            # Fallback to direct substring scan if available
            doc_data = self._user_stores.get(uid, {}).get(doc_id)
            if doc_data and doc_data.get("full_text"):
                q_terms = [w.lower() for w in question.split() if len(w) > 2]
                lines = doc_data["full_text"].splitlines()
                matching_lines = [l.strip() for l in lines if any(t in l.lower() for t in q_terms)]
                if matching_lines:
                    return {
                        "answer": "\n".join(matching_lines[:3]),
                        "sources": [{"title": doc_data["title"], "score": 0.5}],
                        "vector_engine": "substring_fallback",
                    }
            return {
                "answer": "No relevant context found in this document for your question.",
                "sources": [],
                "vector_engine": "none",
            }

        title = matches[0]["title"]
        context_blocks = "\n\n".join([f"[{m['title']} - Section {m['chunk_index']}]:\n{m['text']}" for m in matches])

        # Attempt LLM synthesis via Groq if key is available
        groq_key = getattr(settings, "GROQ_API_KEY", "") or ""
        if groq_key.strip():
            try:
                import groq
                client = groq.Groq(api_key=groq_key.strip())
                prompt = f"""You are WorkPilot AI's executive document intelligence assistant.
Answer the user's question directly and concisely using ONLY the provided document context below.
Cite the document title and key facts accurately. If the document does not mention the answer, state that clearly.

DOCUMENT CONTEXT:
{context_blocks}

QUESTION: {question}

CONCISE GROUNDED ANSWER:"""
                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=400,
                )
                answer_text = completion.choices[0].message.content.strip()
                if answer_text:
                    return {
                        "answer": answer_text,
                        "sources": [{"title": m["title"], "score": m["score"], "chunk": m["chunk_index"]} for m in matches],
                        "vector_engine": matches[0].get("source", "vector_knowledge_base"),
                    }
            except Exception as e:
                logger.debug(f"Groq answer synthesis failed: {e}; falling back to grounded excerpt format.")

        # Grounded structured excerpt synthesis fallback
        excerpts = [f"• {m['text']}" for m in matches]
        synthesis = f"Based on '{title}':\n\n" + "\n\n".join(excerpts)

        return {
            "answer": synthesis,
            "sources": [{"title": m["title"], "score": m["score"], "chunk": m["chunk_index"]} for m in matches],
            "vector_engine": matches[0].get("source", "vector_knowledge_base"),
        }

    def delete_document(self, uid: str, doc_id: str) -> bool:
        """
        Remove a document and its vectors from both local store and Pinecone cloud database.
        """
        deleted_local = False
        if uid in self._user_stores and doc_id in self._user_stores[uid]:
            del self._user_stores[uid][doc_id]
            deleted_local = True

        deleted_cloud = False
        if self.pinecone.is_available():
            deleted_cloud = self.pinecone.delete(uid, doc_id)

        return deleted_local or deleted_cloud


vector_knowledge_service = VectorKnowledgeService()
