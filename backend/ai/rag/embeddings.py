from langchain_huggingface import HuggingFaceEmbeddings


class EmbeddingService:
    """
    Generates vector embeddings for RAG documents
    and user queries.
    """

    model_name = "sentence-transformers/all-MiniLM-L6-v2"

    def __init__(self) -> None:
        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.model_name,
        )

    def embed_document(self, text: str) -> list[float]:
        return self.embeddings.embed_query(text)

    def embed_query(self, text: str) -> list[float]:
        return self.embeddings.embed_query(text)

    @property
    def dimensions(self) -> int:
        return 384


embedding_service = EmbeddingService()