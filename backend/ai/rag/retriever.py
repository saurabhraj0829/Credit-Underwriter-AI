from dataclasses import asdict
from typing import Any

from backend.ai.rag.knowledge_base import (
    KnowledgeDocument,
    knowledge_base,
)


class KnowledgeRetriever:
    """
    Retrieves relevant underwriting knowledge
    from the knowledge base.

    Current implementation:
    - Lightweight keyword matching

    Future implementation:
    - Embeddings
    - pgvector
    - Semantic similarity search
    """

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
    ) -> list[dict[str, Any]]:
        if not query.strip():
            return []

        query_terms = {
            term.lower()
            for term in query.split()
            if len(term.strip()) > 2
        }

        scored_documents = []

        for document in knowledge_base.get_documents():
            searchable_text = (
                f"{document.title} "
                f"{document.category} "
                f"{document.content}"
            ).lower()

            score = sum(
                1
                for term in query_terms
                if term in searchable_text
            )

            if score > 0:
                scored_documents.append(
                    (score, document)
                )

        scored_documents.sort(
            key=lambda item: item[0],
            reverse=True,
        )

        return [
            {
                **asdict(document),
                "relevance_score": score,
            }
            for score, document in scored_documents[:top_k]
        ]


knowledge_retriever = KnowledgeRetriever()