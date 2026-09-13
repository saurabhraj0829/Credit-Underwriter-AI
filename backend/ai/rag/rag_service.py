from typing import Any

from backend.ai.rag.embeddings import embedding_service
from backend.ai.rag.vector_store import vector_store


class RAGService:
    """
    Enterprise RAG service.

    Responsibilities:
    - Generate query embeddings
    - Retrieve semantically relevant policy chunks
    - Apply relevance threshold
    - Apply evidence-quality filtering
    - Return structured evidence metadata
    """

    name = "Underwriting RAG Service"
    version = "1.2"

    DEFAULT_TOP_K = 5
    MIN_RELEVANCE_SCORE = 0.45

    REGULATORY_KEYWORDS = {
        "rbi",
        "regulatory",
        "regulation",
        "statutory",
        "official",
        "circular",
        "guideline",
        "mandated",
        "legal requirement",
    }

    SPECIFIC_RULE_KEYWORDS = {
        "interest rate",
        "rate",
        "limit",
        "threshold",
        "maximum",
        "minimum",
        "percentage",
        "tenure",
        "fee",
        "charge",
    }

    GENERIC_DISCLAIMER_PHRASES = {
        "fictional internal policy",
        "not a policy of any real financial institution",
        "illustrative project policy",
        "not a replacement for current",
        "must not be presented as universal regulatory requirements",
        "authoritative rbi sources",
    }

    def retrieve(
        self,
        query: str,
        top_k: int = DEFAULT_TOP_K,
    ) -> dict[str, Any]:
        """
        Retrieve policy evidence for a natural-language query.
        """

        if not query or not query.strip():
            return {
                "status": "Invalid Query",
                "query": query,
                "results": [],
                "result_count": 0,
                "evidence_available": False,
                "retrieval_reason": "Empty query",
            }

        query = query.strip()

        query_embedding = embedding_service.embed_query(
            query
        )

        raw_results = vector_store.similarity_search(
            query_embedding=query_embedding,
            top_k=top_k,
        )

        threshold_results = [
            result
            for result in raw_results
            if result.get("relevance_score", 0.0)
            >= self.MIN_RELEVANCE_SCORE
        ]

        quality_results = [
            result
            for result in threshold_results
            if self._is_quality_evidence(
                query,
                result,
            )
        ]

        return {
            "status": "Completed",
            "query": query,
            "results": quality_results,
            "result_count": len(quality_results),
            "evidence_available": bool(
                quality_results
            ),
            "top_k": top_k,
            "relevance_threshold": (
                self.MIN_RELEVANCE_SCORE
            ),
            "retrieved_candidates": len(
                threshold_results
            ),
            "retrieval_reason": (
                "Relevant policy evidence retrieved"
                if quality_results
                else "No sufficiently specific policy evidence retrieved"
            ),
        }

    def _is_quality_evidence(
        self,
        query: str,
        result: dict[str, Any],
    ) -> bool:
        """
        Determine whether a retrieved chunk is
        sufficiently specific to support the query.
        """

        content = result.get(
            "content",
            "",
        ).lower()

        query_lower = query.lower()

        # ---------------------------------------------------------
        # Remove generic disclaimer-only chunks
        # ---------------------------------------------------------

        disclaimer_hits = sum(
            phrase in content
            for phrase in self.GENERIC_DISCLAIMER_PHRASES
        )

        meaningful_content = (
            disclaimer_hits == 0
            or len(content) > 900
        )

        if not meaningful_content:
            return False

        # ---------------------------------------------------------
        # Regulatory-specific query handling
        # ---------------------------------------------------------

        is_regulatory_query = any(
            keyword in query_lower
            for keyword in self.REGULATORY_KEYWORDS
        )

        is_specific_rule_query = any(
            keyword in query_lower
            for keyword in self.SPECIFIC_RULE_KEYWORDS
        )

        if (
            is_regulatory_query
            and is_specific_rule_query
        ):
            category = result.get(
                "category",
                "",
            ).lower()

            # Regulatory-specific questions should
            # prefer regulatory evidence.
            if "regulatory" not in category:
                return False

            # Generic disclaimer text is not enough
            # to support a regulatory rate/limit/etc.
            if disclaimer_hits >= 2:
                return False

        # ---------------------------------------------------------
        # General quality check
        # ---------------------------------------------------------

        if len(content.strip()) < 100:
            return False

        return True


rag_service = RAGService()