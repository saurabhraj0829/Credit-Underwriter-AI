from typing import Any

from backend.ai.rag.chunker import document_chunker
from backend.ai.rag.embeddings import embedding_service
from backend.ai.rag.knowledge_base import KnowledgeDocument
from backend.ai.rag.vector_store import vector_store


class RAGIndexer:
    """
    Indexes underwriting knowledge documents.

    Pipeline:
        KnowledgeDocument
            ↓
        Chunking
            ↓
        Embeddings
            ↓
        Vector Store
    """

    name = "RAG Knowledge Indexer"
    version = "1.0"

    def index_document(
        self,
        document: KnowledgeDocument,
    ) -> dict[str, Any]:
        """
        Chunk and embed one knowledge document.
        """

        chunks = document_chunker.split_document(
            document
        )

        if not chunks:
            return {
                "status": "No Content",
                "document_id": document.document_id,
                "chunks_created": 0,
                "embeddings_created": 0,
            }

        embeddings: list[list[float]] = []

        for chunk in chunks:
            embedding = embedding_service.embed_document(
                chunk["content"]
            )

            embeddings.append(embedding)

        storage_result = vector_store.add_documents(
            documents=chunks,
            embeddings=embeddings,
        )

        return {
            "status": storage_result["status"],
            "document_id": document.document_id,
            "title": document.title,
            "category": document.category,
            "chunks_created": len(chunks),
            "embeddings_created": len(embeddings),
            "embedding_dimensions": (
                embedding_service.dimensions
            ),
            "storage": storage_result["storage"],
        }

    def index_documents(
        self,
        documents: list[KnowledgeDocument],
    ) -> dict[str, Any]:
        """
        Index all knowledge documents.
        """

        results: list[dict[str, Any]] = []

        total_chunks = 0
        total_embeddings = 0

        for document in documents:
            result = self.index_document(document)

            results.append(result)

            total_chunks += result.get(
                "chunks_created",
                0,
            )

            total_embeddings += result.get(
                "embeddings_created",
                0,
            )

        return {
            "status": "Completed",
            "documents_processed": len(documents),
            "total_chunks": total_chunks,
            "total_embeddings": total_embeddings,
            "embedding_dimensions": (
                embedding_service.dimensions
            ),
            "results": results,
        }


rag_indexer = RAGIndexer()