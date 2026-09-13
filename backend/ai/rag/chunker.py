from typing import Any


class DocumentChunker:
    """
    Splits knowledge documents into smaller chunks
    suitable for embedding and retrieval.
    """

    def __init__(
        self,
        chunk_size: int = 800,
        chunk_overlap: int = 120,
    ) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> list[str]:
        if not text or not text.strip():
            return []

        text = text.strip()

        chunks: list[str] = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = min(
                start + self.chunk_size,
                text_length,
            )

            chunk = text[start:end].strip()

            if chunk:
                chunks.append(chunk)

            if end >= text_length:
                break

            start = max(
                end - self.chunk_overlap,
                start + 1,
            )

        return chunks

    def split_document(
        self,
        document: Any,
    ) -> list[dict[str, Any]]:
        chunks = self.split_text(document.content)

        return [
            {
                "document_id": document.document_id,
                "title": document.title,
                "category": document.category,
                "source": document.source,
                "chunk_index": index,
                "content": chunk,
            }
            for index, chunk in enumerate(chunks)
        ]


document_chunker = DocumentChunker()