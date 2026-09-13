from dataclasses import dataclass
from typing import Any

from backend.services.document_verification import verify_documents


@dataclass
class DocumentVerificationResult:
    application_id: int
    application_number: str
    status: str
    required_documents: list[str]
    uploaded_documents: list[str]
    missing_documents: list[str]
    suspicious_documents: list[dict[str, Any]]
    document_count: int
    next_step: str
    reasons: list[str]


class DocumentVerificationAgent:
    """
    Document Verification Agent.

    Responsibilities:
    - Verify uploaded loan documents
    - Detect missing documents
    - Detect document integrity issues
    - Detect suspicious OCR signals
    - Validate document type against OCR content
    - Produce structured verification output
    - Route the application to the next workflow stage
    """

    name = "Document Verification Agent"
    version = "1.0"

    def analyze(
        self,
        application: Any,
        documents: list[Any],
    ) -> dict[str, Any]:
        """
        Run the existing document verification service
        and convert its result into an agent-level output.
        """

        verification_result = verify_documents(
            documents
        )

        status = verification_result["status"]

        missing_documents = verification_result[
            "missing_documents"
        ]

        suspicious_documents = verification_result[
            "suspicious_documents"
        ]

        reasons: list[str] = []

        if missing_documents:
            reasons.append(
                "Required documents are missing."
            )

        if suspicious_documents:
            reasons.append(
                "One or more document verification "
                "signals require attention."
            )

        if (
            not missing_documents
            and not suspicious_documents
        ):
            reasons.append(
                "All uploaded documents passed verification."
            )

        if status == "Verified":
            next_step = "Income Verification Agent"
        elif status == "Incomplete":
            next_step = "Collect Missing Documents"
        else:
            next_step = "Manual Review"

        result = DocumentVerificationResult(
            application_id=int(application.id),
            application_number=str(
                application.application_number
            ),
            status=status,
            required_documents=verification_result[
                "required_documents"
            ],
            uploaded_documents=verification_result[
                "uploaded_documents"
            ],
            missing_documents=missing_documents,
            suspicious_documents=suspicious_documents,
            document_count=len(documents),
            next_step=next_step,
            reasons=reasons,
        )

        return {
            "agent": self.name,
            "agent_version": self.version,
            "application_id": result.application_id,
            "application_number": result.application_number,
            "verification_status": result.status,
            "required_documents": result.required_documents,
            "uploaded_documents": result.uploaded_documents,
            "missing_documents": result.missing_documents,
            "suspicious_documents": result.suspicious_documents,
            "document_count": result.document_count,
            "next_step": result.next_step,
            "reasons": result.reasons,
        }


document_verification_agent = DocumentVerificationAgent()