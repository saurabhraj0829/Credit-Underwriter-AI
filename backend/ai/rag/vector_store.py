from pathlib import Path
from typing import Any

import chromadb


class VectorStore:
    """
    Persistent ChromaDB vector store for the
    Credit Underwriter AI RAG system.

    Stores:
    - Document chunks
    - Embeddings
    - Policy metadata

    Uses:
    - Persistent local storage
    - Cosine similarity retrieval
    """

    name = "ChromaDB Persistent Vector Store"
    embedding_dimensions = 384

    def __init__(self) -> None:
        project_root = Path(__file__).resolve().parents[3]

        self.storage_path = (
            project_root
            / "storage"
            / "chroma"
        )

        self.storage_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.client = chromadb.PersistentClient(
            path=str(self.storage_path)
        )

        self.collection = self.client.get_or_create_collection(
            name="underwriting_policy_knowledge",
            configuration={
                "hnsw": {
                    "space": "cosine"
                }
            },
        )

    def add_documents(
        self,
        documents: list[dict[str, Any]],
        embeddings: list[list[float]],
    ) -> dict[str, Any]:
        """
        Persist document chunks and embeddings
        into ChromaDB.
        """

        if len(documents) != len(embeddings):
            raise ValueError(
                "Documents and embeddings count must match."
            )

        if not documents:
            return {
                "status": "No Content",
                "documents_received": 0,
                "embedding_dimensions": (
                    self.embedding_dimensions
                ),
                "storage": self.name,
            }

        ids = []
        metadatas = []
        contents = []

        for document in documents:
            document_id = document["document_id"]
            chunk_index = document["chunk_index"]

            ids.append(
                f"{document_id}-chunk-{chunk_index}"
            )

            metadatas.append(
                {
                    "document_id": document_id,
                    "category": document["category"],
                    "source": document["source"],
                    "chunk_index": chunk_index,
                }
            )

            contents.append(
                document["content"]
            )

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=contents,
            metadatas=metadatas,
        )

        return {
            "status": "Indexed",
            "documents_received": len(documents),
            "embedding_dimensions": (
                self.embedding_dimensions
            ),
            "storage": self.name,
            "collection": (
                self.collection.name
            ),
            "total_vectors": (
                self.collection.count()
            ),
        }

    def similarity_search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Retrieve the most relevant policy chunks
        using ChromaDB cosine similarity.
        """

        if len(query_embedding) != self.embedding_dimensions:
            raise ValueError(
                f"Expected embedding dimension "
                f"{self.embedding_dimensions}, "
                f"received {len(query_embedding)}."
            )

        if self.collection.count() == 0:
            return []

        result = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=[
                "documents",
                "metadatas",
                "distances",
            ],
        )

        documents = result.get(
            "documents",
            [[]],
        )[0]

        metadatas = result.get(
            "metadatas",
            [[]],
        )[0]

        distances = result.get(
            "distances",
            [[]],
        )[0]

        results = []

        for document, metadata, distance in zip(
            documents,
            metadatas,
            distances,
        ):
            # Chroma cosine distance:
            # 0 = identical
            # 1 = very dissimilar
            #
            # Convert to similarity score so the
            # existing RAG threshold remains usable.
            similarity = 1.0 - float(distance)

            results.append(
                {
                    "document_id": metadata[
                        "document_id"
                    ],
                    "category": metadata[
                        "category"
                    ],
                    "source": metadata[
                        "source"
                    ],
                    "chunk_index": metadata[
                        "chunk_index"
                    ],
                    "content": document,
                    "relevance_score": round(
                        similarity,
                        4,
                    ),
                }
            )

        return results

    def count(self) -> int:
        """Return the total number of stored vectors."""

        return self.collection.count()


vector_store = VectorStore()