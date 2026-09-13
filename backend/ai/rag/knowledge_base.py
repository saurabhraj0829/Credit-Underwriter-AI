from dataclasses import dataclass


@dataclass
class KnowledgeDocument:
    """
    Represents one document in the underwriting
    knowledge base.
    """

    document_id: str
    title: str
    category: str
    content: str
    source: str


class KnowledgeBase:
    """
    In-memory knowledge base abstraction.

    Later this layer will be connected to:
    - embeddings
    - pgvector
    - semantic retrieval
    """

    def __init__(self) -> None:
        self.documents: list[KnowledgeDocument] = []

    def add_document(
        self,
        document: KnowledgeDocument,
    ) -> None:
        self.documents.append(document)

    def get_documents(self) -> list[KnowledgeDocument]:
        return self.documents

    def count(self) -> int:
        return len(self.documents)


knowledge_base = KnowledgeBase()