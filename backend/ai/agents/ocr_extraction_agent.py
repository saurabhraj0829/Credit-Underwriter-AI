from dataclasses import dataclass
from typing import Any

from backend.services.ocr_engine import extract_text_from_document


@dataclass
class OCRExtractionResult:
    document_id: int
    document_type: str
    original_filename: str
    ocr_status: str
    extracted_text: str | None
    text_length: int
    next_step: str
    reasons: list[str]


class OCRExtractionAgent:
    """
    OCR Extraction Agent.

    Responsibilities:
    - Receive uploaded documents
    - Invoke the existing OCR engine
    - Extract document text
    - Return structured OCR results
    - Identify OCR failures
    - Pass successful documents to verification
    """

    name = "OCR Extraction Agent"
    version = "1.0"

    def analyze(
        self,
        document: Any,
    ) -> dict[str, Any]:
        """
        Process one uploaded document through the OCR engine.
        """

        reasons: list[str] = []

        if not document.file_path:
            return {
                "agent": self.name,
                "agent_version": self.version,
                "document_id": int(document.id),
                "document_type": str(
                    document.document_type
                ),
                "original_filename": str(
                    document.original_filename
                ),
                "ocr_status": "Failed",
                "extracted_text": None,
                "text_length": 0,
                "next_step": "Document Verification Agent",
                "reasons": [
                    "Document file path is missing."
                ],
            }

        try:
            extracted_text = extract_text_from_document(
    document.file_path
)

            if extracted_text is None:
                extracted_text = ""

            extracted_text = str(
                extracted_text
            ).strip()

        except Exception as exc:
            return {
                "agent": self.name,
                "agent_version": self.version,
                "document_id": int(document.id),
                "document_type": str(
                    document.document_type
                ),
                "original_filename": str(
                    document.original_filename
                ),
                "ocr_status": "Failed",
                "extracted_text": None,
                "text_length": 0,
                "next_step": "Document Verification Agent",
                "reasons": [
                    f"OCR processing failed: {exc}"
                ],
            }

        if not extracted_text:
            reasons.append(
                "OCR completed but no text was extracted."
            )

            result = OCRExtractionResult(
                document_id=int(document.id),
                document_type=str(
                    document.document_type
                ),
                original_filename=str(
                    document.original_filename
                ),
                ocr_status="Failed",
                extracted_text=None,
                text_length=0,
                next_step="Document Verification Agent",
                reasons=reasons,
            )

        else:
            reasons.append(
                "Document text extracted successfully."
            )

            result = OCRExtractionResult(
                document_id=int(document.id),
                document_type=str(
                    document.document_type
                ),
                original_filename=str(
                    document.original_filename
                ),
                ocr_status="Completed",
                extracted_text=extracted_text,
                text_length=len(extracted_text),
                next_step="Document Verification Agent",
                reasons=reasons,
            )

        return {
            "agent": self.name,
            "agent_version": self.version,
            "document_id": result.document_id,
            "document_type": result.document_type,
            "original_filename": result.original_filename,
            "ocr_status": result.ocr_status,
            "extracted_text": result.extracted_text,
            "text_length": result.text_length,
            "next_step": result.next_step,
            "reasons": result.reasons,
        }


ocr_extraction_agent = OCRExtractionAgent()