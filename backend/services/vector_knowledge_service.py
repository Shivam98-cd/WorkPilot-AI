"""
WorkPilot AI - Enterprise Vector Knowledge & RAG Pipeline
Provides semantic chunking, vector embedding, and hybrid similarity search
across uploaded documents, knowledge items, and workspace interactions.
"""
import io
import math
import re
from collections import Counter
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger("vector_knowledge")


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
        # Filter printable strings
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
            split_point += 1  # Include the boundary

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


def _compute_vector(tokens: List[str], idf_map: Optional[Dict[str, float]] = None) -> Dict[str, float]:
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


def _cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """Compute cosine similarity between two normalized sparse vectors."""
    common_keys = set(vec1.keys()) & set(vec2.keys())
    return sum(vec1[k] * vec2[k] for k in common_keys)


class VectorKnowledgeService:
    """
    Multi-tenant semantic vector store and RAG retrieval service.
    Maintains per-user document indexes in memory with fast similarity lookup.
    """

    def __init__(self):
        # In-memory index: uid -> { doc_id: { "meta": {...}, "chunks": [{...}], "vectors": [{...}] } }
        self._user_stores: Dict[str, Dict[str, Any]] = {}

    def index_document(self, uid: str, doc_id: str, title: str, text: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """
        Chunk and vector-embed a document into the user's vector store.
        Returns the number of indexed chunks.
        """
        if not text.strip():
            return 0

        chunks = chunk_text(text)
        if not chunks:
            return 0

        # Build vocabulary IDF for this document
        all_tokens = [_tokenize(c["text"]) for c in chunks]
        doc_count = len(chunks)
        doc_freq = Counter()
        for t_list in all_tokens:
            doc_freq.update(set(t_list))

        idf_map = {
            term: math.log((doc_count + 1) / (df + 1)) + 1.0
            for term, df in doc_freq.items()
        }

        vectors = [_compute_vector(t_list, idf_map) for t_list in all_tokens]

        if uid not in self._user_stores:
            self._user_stores[uid] = {}

        self._user_stores[uid][doc_id] = {
            "title": title,
            "metadata": metadata or {},
            "indexed_at": datetime.now(timezone.utc).isoformat(),
            "chunks": chunks,
            "vectors": vectors,
            "idf_map": idf_map,
            "full_text": text,
        }

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
        """
        query_tokens = _tokenize(query)
        if not query_tokens or uid not in self._user_stores:
            return []

        user_docs = self._user_stores[uid]
        targets = {doc_id: user_docs[doc_id]} if doc_id and doc_id in user_docs else user_docs

        results = []
        for d_id, doc_data in targets.items():
            idf = doc_data.get("idf_map", {})
            query_vec = _compute_vector(query_tokens, idf)

            for i, (chunk, chunk_vec) in enumerate(zip(doc_data["chunks"], doc_data["vectors"])):
                score = _cosine_similarity(query_vec, chunk_vec)
                # Word-overlap boost for exact phrase hits
                overlap_count = sum(1 for q in query_tokens if q in chunk["text"].lower())
                if overlap_count > 0:
                    score += 0.05 * min(overlap_count, 4)

                if score >= min_score:
                    results.append({
                        "doc_id": d_id,
                        "title": doc_data["title"],
                        "chunk_index": i,
                        "text": chunk["text"],
                        "score": round(score, 4),
                    })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def answer_query(self, uid: str, doc_id: str, question: str) -> Dict[str, Any]:
        """
        Retrieve relevant excerpts and synthesize a grounded answer.
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
                    }
            return {
                "answer": "No relevant context found in this document for your question.",
                "sources": [],
            }

        excerpts = [f"• {m['text']}" for m in matches]
        synthesis = f"Based on '{matches[0]['title']}':\n\n" + "\n\n".join(excerpts)

        return {
            "answer": synthesis,
            "sources": [{"title": m["title"], "score": m["score"], "chunk": m["chunk_index"]} for m in matches],
        }

    def delete_document(self, uid: str, doc_id: str) -> bool:
        """Remove a document and its vectors from the user store."""
        if uid in self._user_stores and doc_id in self._user_stores[uid]:
            del self._user_stores[uid][doc_id]
            return True
        return False


vector_knowledge_service = VectorKnowledgeService()
